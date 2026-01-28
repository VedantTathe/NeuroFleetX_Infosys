package com.neurofleetx.controller;

import com.neurofleetx.entity.User;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Return users without sensitive fields (password)
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> result = users.stream().map(u -> {
                java.util.Map<String, Object> m = new java.util.HashMap<>();
                m.put("id", u.getId());
                m.put("name", u.getName());
                m.put("email", u.getEmail());
                m.put("role", u.getRole());
                m.put("companyName", u.getCompanyName());
                m.put("licenseNumber", u.getLicenseNumber());
                m.put("active", u.isActive());
                m.put("createdAt", u.getCreatedAt());
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        try {
            return userRepository.findById(id)
                    .map(u -> {
                        java.util.Map<String, Object> m = new java.util.HashMap<>();
                        m.put("id", u.getId());
                        m.put("name", u.getName());
                        m.put("email", u.getEmail());
                        m.put("role", u.getRole());
                        m.put("companyName", u.getCompanyName());
                        m.put("licenseNumber", u.getLicenseNumber());
                        m.put("active", u.isActive());
                        m.put("createdAt", u.getCreatedAt());
                        return ResponseEntity.ok(m);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
