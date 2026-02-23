package com.example.myproject.service;

import com.example.myproject.entity.OrderEntity;
import com.example.myproject.entity.OrderItemEntity;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ─────────────────────────────────────────────────────────────────────────
    // WELCOME EMAIL
    // ─────────────────────────────────────────────────────────────────────────
    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Welcome to Maison Dorée Bakery! 🎉");
            helper.setText(buildWelcomeHtml(fullName), true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ORDER CONFIRMATION — called from OrderService (COD) and RazorpayService (online)
    //
    // FIX: We extract all data from the managed entity HERE (on the caller's thread,
    // while the Hibernate session is still open), then pass plain Strings to the
    // @Async method so there are NO lazy-load calls on the async background thread.
    // ─────────────────────────────────────────────────────────────────────────
    public void sendOrderConfirmationEmail(OrderEntity order) {
        // Extract everything from the entity NOW while session is open
        try {
            String toEmail      = order.getUser().getEmail();      // safe: called in-session
            String customerName = order.getShippingName();
            String orderNumber  = order.getOrderNumber();
            boolean isCod       = order.getPaymentMethod() == OrderEntity.PaymentMethod.COD;

            // Build a snapshot of items (plain data, no proxies)
            StringBuilder itemRows = new StringBuilder();
            if (order.getOrderItems() != null) {
                for (OrderItemEntity item : order.getOrderItems()) {
                    itemRows.append(buildItemRow(item.getProductName(), item.getQuantity(), item.getSubtotal()));
                }
            }

            String orderDate = order.getCreatedAt() != null
                ? order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
                : "—";

            String totalAmount  = fmt(order.getTotalAmount());
            String shippingFee  = (order.getShippingFee() == null || order.getShippingFee().compareTo(BigDecimal.ZERO) == 0)
                ? "FREE" : fmt(order.getShippingFee());
            String finalAmount  = fmt(order.getFinalAmount());

            String address = esc(order.getShippingAddress()) + ", "
                + esc(order.getShippingCity()) + ", "
                + esc(order.getShippingState()) + " – " + esc(order.getShippingPincode());

            String phone     = esc(order.getShippingPhone());
            String notes     = order.getOrderNotes() != null && !order.getOrderNotes().isBlank()
                ? "📝 " + esc(order.getOrderNotes()) : "";

            // Now fire the async send with only plain String data — no entity references
            sendOrderEmailAsync(toEmail, customerName, orderNumber, orderDate,
                isCod, itemRows.toString(), totalAmount, shippingFee, finalAmount,
                address, phone, notes);

        } catch (Exception e) {
            System.err.println("Failed to prepare order confirmation email: " + e.getMessage());
        }
    }

    // @Async runs on a background thread — receives ONLY plain Strings, no entity proxies
    @Async
    public void sendOrderEmailAsync(
        String toEmail, String customerName, String orderNumber, String orderDate,
        boolean isCod, String itemRowsHtml, String totalAmount, String shippingFee,
        String finalAmount, String address, String phone, String notes
    ) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);

            helper.setSubject(isCod
                ? "Order Confirmed! 🎊 #" + orderNumber + " – Pay on Delivery"
                : "Payment Successful! ✅ Order #" + orderNumber + " Confirmed");

            helper.setText(buildOrderHtml(customerName, orderNumber, orderDate, isCod,
                itemRowsHtml, totalAmount, shippingFee, finalAmount, address, phone, notes), true);

            mailSender.send(message);
            System.out.println("✅ Order confirmation email sent → " + toEmail);
        } catch (MessagingException e) {
            System.err.println("❌ Failed to send order confirmation email: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTML BUILDERS
    // ─────────────────────────────────────────────────────────────────────────
    private String buildOrderHtml(
        String customerName, String orderNumber, String orderDate, boolean isCod,
        String itemRowsHtml, String totalAmount, String shippingFee, String finalAmount,
        String address, String phone, String notes
    ) {
        String paymentColor = isCod ? "#d97706" : "#059669";
        String paymentBadge = isCod ? "💵 Cash on Delivery" : "✅ Paid Online (Razorpay)";

        String paymentNote = isCod
            ? "<div style='background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;"
              + "border-radius:6px;margin:20px 0;color:#92400e;font-size:14px;'>"
              + "<strong>💡 Reminder:</strong> Please keep exact change of "
              + "<strong>" + finalAmount + "</strong> ready for our delivery partner.</div>"
            : "<div style='background:#f0fdf4;border-left:4px solid #22c55e;padding:14px 16px;"
              + "border-radius:6px;margin:20px 0;color:#166534;font-size:14px;'>"
              + "✅ <strong>Payment received.</strong> Your fresh bakes are being prepared right now!</div>";

        String notesRow = notes.isEmpty() ? "" :
            "<p style='margin:8px 0 0;color:#888;font-size:13px;font-style:italic;'>" + notes + "</p>";

        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>"
            + "<meta name='viewport' content='width=device-width,initial-scale=1'></head>"
            + "<body style='margin:0;padding:0;background:#fdf6ee;font-family:Arial,sans-serif;'>"

            + "<div style='max-width:620px;margin:30px auto;background:#fff;border-radius:14px;"
            + "overflow:hidden;box-shadow:0 4px 24px rgba(139,69,19,0.13);'>"

            // Header
            + "<div style='background:linear-gradient(135deg,#8B4513,#5c2d0a);padding:42px 30px;text-align:center;'>"
            + "<p style='color:#f8d7a0;margin:0 0 6px;font-size:12px;letter-spacing:3px;text-transform:uppercase;'>Maison Dorée</p>"
            + "<h1 style='color:#fff;margin:0;font-size:26px;'>" + (isCod ? "Order Confirmed! 🎊" : "Payment Successful! 🎉") + "</h1>"
            + "<p style='color:#f8d7a0;margin:10px 0 0;font-size:14px;'>Thank you for choosing our artisan bakery</p>"
            + "</div>"

            // Greeting
            + "<div style='padding:28px 30px 0;'>"
            + "<h2 style='color:#3d1f08;margin:0 0 6px;font-size:20px;'>Hi " + esc(customerName) + "! 👋</h2>"
            + "<p style='color:#555;margin:0;line-height:1.6;font-size:15px;'>We've received your order and it's being freshly prepared with love.</p>"
            + paymentNote
            + "</div>"

            // Order info bar
            + "<div style='margin:0 30px;border-radius:10px;overflow:hidden;border:1px solid #fde8d0;'>"
            + "<table style='width:100%;border-collapse:collapse;background:#fdf3e7;'><tr>"
            + "<td style='padding:14px 18px;border-right:1px solid #fde8d0;'>"
            + "<p style='margin:0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;'>Order No.</p>"
            + "<p style='margin:4px 0 0;font-weight:700;color:#8B4513;font-size:15px;'>#" + esc(orderNumber) + "</p>"
            + "</td>"
            + "<td style='padding:14px 18px;border-right:1px solid #fde8d0;'>"
            + "<p style='margin:0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;'>Date</p>"
            + "<p style='margin:4px 0 0;font-weight:600;color:#3d1f08;font-size:13px;'>" + orderDate + "</p>"
            + "</td>"
            + "<td style='padding:14px 18px;'>"
            + "<p style='margin:0;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;'>Payment</p>"
            + "<p style='margin:4px 0 0;font-weight:600;font-size:13px;color:" + paymentColor + ";'>" + paymentBadge + "</p>"
            + "</td>"
            + "</tr></table></div>"

            // Items
            + "<div style='padding:22px 30px 0;'>"
            + "<h3 style='color:#3d1f08;margin:0 0 10px;font-size:15px;border-bottom:2px solid #fde8d0;padding-bottom:8px;'>🛒 Items Ordered</h3>"
            + "<table style='width:100%;border-collapse:collapse;'>"
            + "<thead><tr style='background:#fdf3e7;'>"
            + "<th style='padding:9px 8px;text-align:left;color:#8B4513;font-size:11px;text-transform:uppercase;letter-spacing:1px;'>Product</th>"
            + "<th style='padding:9px 8px;text-align:center;color:#8B4513;font-size:11px;text-transform:uppercase;letter-spacing:1px;'>Qty</th>"
            + "<th style='padding:9px 8px;text-align:right;color:#8B4513;font-size:11px;text-transform:uppercase;letter-spacing:1px;'>Amount</th>"
            + "</tr></thead>"
            + "<tbody>" + itemRowsHtml + "</tbody>"
            + "</table></div>"

            // Totals
            + "<div style='padding:14px 30px;'>"
            + "<table style='width:100%;border-collapse:collapse;'>"
            + "<tr><td style='padding:5px 0;color:#666;font-size:14px;'>Subtotal</td>"
            + "<td style='padding:5px 0;text-align:right;color:#333;font-size:14px;'>" + totalAmount + "</td></tr>"
            + "<tr><td style='padding:5px 0;color:#666;font-size:14px;'>Shipping</td>"
            + "<td style='padding:5px 0;text-align:right;font-size:14px;color:#059669;font-weight:600;'>" + shippingFee + "</td></tr>"
            + "<tr style='border-top:2px solid #fde8d0;'>"
            + "<td style='padding:10px 0 4px;font-weight:700;color:#3d1f08;font-size:16px;'>" + (isCod ? "Amount Due" : "Total Paid") + "</td>"
            + "<td style='padding:10px 0 4px;text-align:right;font-weight:700;color:#8B4513;font-size:18px;'>" + finalAmount + "</td>"
            + "</tr></table></div>"

            // Delivery address
            + "<div style='margin:0 30px 22px;background:#fdf3e7;border-radius:10px;padding:16px 18px;'>"
            + "<h3 style='margin:0 0 10px;color:#3d1f08;font-size:15px;'>📦 Delivery Address</h3>"
            + "<p style='margin:0;color:#555;line-height:1.7;font-size:14px;'>"
            + "<strong>" + esc(customerName) + "</strong><br>📞 " + phone + "<br>" + address
            + "</p>" + notesRow + "</div>"

            // Next steps
            + "<div style='margin:0 30px 24px;'>"
            + "<h3 style='color:#3d1f08;margin:0 0 14px;font-size:15px;'>🕐 What happens next?</h3>"
            + "<div style='display:flex;'>"
            + step("1","#8B4513","Order Received","Your order is in the queue")
            + step("2","#a0522d","Freshly Baked","Our bakers prepare your items")
            + step("3","#cd853f", isCod ? "Pay on Arrival" : "Out for Delivery",
                   isCod ? "Keep exact change ready" : "Your order is on its way")
            + step("4","#10b981","Delivered!","Enjoy your fresh bakes! 🥐")
            + "</div></div>"

            // Footer
            + "<div style='background:#3d1f08;padding:24px 30px;text-align:center;'>"
            + "<p style='color:#f8d7a0;margin:0 0 4px;font-size:16px;font-weight:600;'>Maison Dorée Artisan Bakery</p>"
            + "<p style='color:#c8a06c;margin:0 0 10px;font-size:13px;'>Freshly baked with love, every single day 🥖</p>"
            + "<p style='color:#c8a06c;margin:0;font-size:12px;'>© 2025 Maison Dorée. All rights reserved.</p>"
            + "</div></div></body></html>";
    }

    private String buildItemRow(String productName, int qty, BigDecimal subtotal) {
        return "<tr>"
            + "<td style='padding:12px 8px;border-bottom:1px solid #fde8d0;color:#3d1f08;'><strong>" + esc(productName) + "</strong></td>"
            + "<td style='padding:12px 8px;border-bottom:1px solid #fde8d0;text-align:center;color:#666;'>× " + qty + "</td>"
            + "<td style='padding:12px 8px;border-bottom:1px solid #fde8d0;text-align:right;color:#8B4513;font-weight:600;'>" + fmt(subtotal) + "</td>"
            + "</tr>";
    }

    private String step(String num, String color, String title, String desc) {
        return "<div style='flex:1;text-align:center;padding:0 5px;'>"
            + "<div style='width:32px;height:32px;border-radius:50%;background:" + color
            + ";color:#fff;font-weight:700;font-size:14px;line-height:32px;display:inline-block;margin-bottom:6px;'>" + num + "</div>"
            + "<p style='margin:0 0 2px;font-weight:600;color:#3d1f08;font-size:12px;'>" + title + "</p>"
            + "<p style='margin:0;color:#888;font-size:11px;line-height:1.4;'>" + desc + "</p>"
            + "</div>";
    }

    private String buildWelcomeHtml(String fullName) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'></head>"
            + "<body style='margin:0;padding:0;background:#fdf6ee;font-family:Arial,sans-serif;'>"
            + "<div style='max-width:600px;margin:30px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(139,69,19,0.12);'>"
            + "<div style='background:linear-gradient(135deg,#8B4513,#5c2d0a);padding:40px 30px;text-align:center;'>"
            + "<p style='color:#f8d7a0;margin:0 0 6px;font-size:12px;letter-spacing:3px;'>MAISON DORÉE</p>"
            + "<h1 style='color:#fff;margin:0;font-size:26px;'>Welcome to the Bakery! 🥐</h1>"
            + "</div>"
            + "<div style='padding:30px;color:#333;line-height:1.6;'>"
            + "<h2>Hi " + esc(fullName) + "! 👋</h2>"
            + "<p>Your account has been created successfully. Welcome to Maison Dorée!</p>"
            + "<p>Browse our fresh breads, pastries, cakes and more — baked daily with love.</p>"
            + "<p>Happy Shopping! 🛍️</p>"
            + "<p><strong>— The Maison Dorée Team</strong></p>"
            + "</div>"
            + "<div style='background:#3d1f08;text-align:center;padding:16px;font-size:12px;color:#c8a06c;'>"
            + "© 2025 Maison Dorée Bakery. All rights reserved."
            + "</div></div></body></html>";
    }

    private String fmt(BigDecimal amount) {
        if (amount == null) return "₹0.00";
        return "₹" + String.format("%,.2f", amount);
    }

    private String esc(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;")
                    .replace(">", "&gt;").replace("\"", "&quot;");
    }
}