package com.example.myproject.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // ✅ Allow React dev server
        configuration.setAllowedOrigins(List.of(
            "http://localhost:3000",
            "http://localhost:5173"  // Vite users
        ));

        // ✅ Allow all needed HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
        ));

        // ✅ Allow Authorization header (needed for JWT)
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
        ));

        // ✅ Allow browser to read Authorization response header
        configuration.setExposedHeaders(List.of("Authorization"));

        // ✅ Do NOT allow credentials with wildcard origin
        configuration.setAllowCredentials(false);

        // ✅ Cache preflight for 1 hour (reduces OPTIONS calls)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}