package com.example.myproject.controller;

import com.example.myproject.dto.CreateOrderRequest;
import com.example.myproject.dto.OrderDTO;
import com.example.myproject.entity.OrderEntity;
import com.example.myproject.entity.UserEntity;
import com.example.myproject.repository.UserRepository;
import com.example.myproject.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // COD ENDPOINTS  ← these were completely missing, which broke COD checkout
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Place a COD order from cart
     * POST /api/orders/cod
     */
    @PostMapping("/cod")
    public ResponseEntity<?> placeCodOrder(
        @Valid @RequestBody CreateOrderRequest request,
        Principal principal
    ) {
        try {
            String userEmail = principal.getName();
            OrderEntity order = orderService.createCodOrderFromCart(userEmail, request);
            OrderDTO dto = OrderDTO.fromEntity(order);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Order placed successfully");
            response.put("orderNumber", dto.getOrderNumber());
            response.put("orderId", dto.getOrderId());
            response.put("order", dto);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Place a COD order via Buy Now (single product, bypasses cart)
     * POST /api/orders/cod/buy-now?productId=X&quantity=Y
     */
    @PostMapping("/cod/buy-now")
    public ResponseEntity<?> placeCodBuyNow(
        @RequestParam Long productId,
        @RequestParam(defaultValue = "1") int quantity,
        @Valid @RequestBody CreateOrderRequest request,
        Principal principal
    ) {
        try {
            String userEmail = principal.getName();
            OrderEntity order = orderService.createCodOrderFromBuyNow(userEmail, productId, quantity, request);
            OrderDTO dto = OrderDTO.fromEntity(order);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Order placed successfully");
            response.put("orderNumber", dto.getOrderNumber());
            response.put("orderId", dto.getOrderId());
            response.put("order", dto);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EXISTING ENDPOINTS (with admin fix applied)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Get orders — ALL orders for ADMIN, own orders for USER
     * GET /api/orders
     */
    @GetMapping
    public ResponseEntity<?> getOrders(Principal principal) {
        try {
            String userEmail = principal.getName();
            UserEntity caller = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<OrderEntity> orders;
            if ("ADMIN".equalsIgnoreCase(caller.getRole())) {
                orders = orderService.getAllOrders();
            } else {
                orders = orderService.getUserOrders(userEmail);
            }

            List<OrderDTO> orderDTOs = orders.stream()
                    .map(OrderDTO::fromEntity)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(orderDTOs);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET /api/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderById(
        @PathVariable Long orderId,
        Principal principal
    ) {
        try {
            String userEmail = principal.getName();
            UserEntity caller = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            OrderEntity order;
            if ("ADMIN".equalsIgnoreCase(caller.getRole())) {
                order = orderService.getOrderByIdAdmin(orderId);
            } else {
                order = orderService.getOrderById(userEmail, orderId);
            }

            return ResponseEntity.ok(OrderDTO.fromEntity(order));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * GET /api/orders/number/{orderNumber}
     */
    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<?> getOrderByNumber(
        @PathVariable String orderNumber,
        Principal principal
    ) {
        try {
            OrderEntity order = orderService.getOrderByOrderNumber(orderNumber);
            UserEntity caller = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isAdmin = "ADMIN".equalsIgnoreCase(caller.getRole());
            if (!isAdmin && !order.getUser().getEmail().equals(principal.getName())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access"));
            }

            return ResponseEntity.ok(OrderDTO.fromEntity(order));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * POST /api/orders/{orderId}/cancel
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(
        @PathVariable Long orderId,
        Principal principal
    ) {
        try {
            String userEmail = principal.getName();
            OrderEntity order = orderService.cancelOrder(userEmail, orderId);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Order cancelled successfully");
            response.put("order", OrderDTO.fromEntity(order));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Admin: update order status
     * PUT /api/orders/{orderId}/status
     */
    @PutMapping("/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
        @PathVariable Long orderId,
        @RequestBody Map<String, String> body,
        Principal principal
    ) {
        try {
            UserEntity caller = userRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!"ADMIN".equalsIgnoreCase(caller.getRole())) {
                return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
            }

            OrderEntity updated = orderService.updateOrderStatus(
                    orderId, body.get("status"), body.get("paymentStatus"));

            return ResponseEntity.ok(OrderDTO.fromEntity(updated));
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}