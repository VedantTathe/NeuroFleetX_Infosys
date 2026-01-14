package com.neurofleetx.controller;

import com.neurofleetx.entity.Booking;
import com.neurofleetx.entity.User;
import com.neurofleetx.entity.Vehicle;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import com.neurofleetx.service.BookingService;
import com.neurofleetx.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleService vehicleService;

    // Create new booking
    @PostMapping(consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> bookingRequest) {
        System.out.println("=== BOOKING CREATION REQUEST ===");
        System.out.println("Request data: " + bookingRequest);
        
        try {
            // Extract and validate required fields
            Long customerId = extractLong(bookingRequest, "customerId");
            Long vehicleId = extractLong(bookingRequest, "vehicleId");
            String pickupAddress = extractString(bookingRequest, "pickupAddress");
            String dropoffAddress = extractString(bookingRequest, "dropoffAddress");
            Double estimatedDistance = extractDouble(bookingRequest, "estimatedDistance");
            Double estimatedDuration = extractDouble(bookingRequest, "estimatedDuration");
            Double estimatedCost = extractDouble(bookingRequest, "estimatedCost");
            Integer passengerCount = extractInteger(bookingRequest, "passengerCount", 1);
            String paymentMethod = extractString(bookingRequest, "paymentMethod", "credit_card");
            
            // Validate required fields
            if (customerId == null || vehicleId == null || pickupAddress == null || dropoffAddress == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Missing required fields: customerId, vehicleId, pickupAddress, dropoffAddress");
                System.out.println("BOOKING CREATION FAILED: Missing required fields");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate addresses
            if (pickupAddress.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Pickup address cannot be empty");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (dropoffAddress.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Dropoff address cannot be empty");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate passenger count
            if (passengerCount < 1 || passengerCount > 8) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Passenger count must be between 1 and 8");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate cost
            if (estimatedCost <= 0) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Estimated cost must be greater than 0");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Fetch actual entities
            User customer = userRepository.findById(customerId).orElse(null);
            Vehicle vehicle = vehicleRepository.findById(vehicleId).orElse(null);
            
            if (customer == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Customer not found with ID: " + customerId);
                System.out.println("BOOKING CREATION FAILED: Customer not found - " + customerId);
                return ResponseEntity.badRequest().body(error);
            }
            
            if (vehicle == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Vehicle not found with ID: " + vehicleId);
                System.out.println("BOOKING CREATION FAILED: Vehicle not found - " + vehicleId);
                return ResponseEntity.badRequest().body(error);
            }
            
            // Check if vehicle is available
            if (!vehicle.getIsAvailable()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Vehicle is not available for booking");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Check if customer is active
            if (!customer.isActive()) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Customer account is not active");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Create booking object
            Booking booking = new Booking();
            booking.setCustomer(customer);
            booking.setVehicle(vehicle);
            booking.setPickupAddress(pickupAddress.trim());
            booking.setDropoffAddress(dropoffAddress.trim());
            booking.setEstimatedDistance(estimatedDistance);
            booking.setEstimatedDuration(estimatedDuration);
            booking.setEstimatedCost(estimatedCost);
            booking.setPassengerCount(passengerCount);
            booking.setPaymentMethod(paymentMethod);
            booking.setPaymentStatus("PENDING");
            booking.setStatus("PENDING");
            
            // Set actual fields to null for new bookings (these will be updated when trip completes)
            booking.setActualDistance(null);
            booking.setActualDuration(null);
            booking.setActualPickupTime(null);
            booking.setActualDropoffTime(null);
            
            // Set coordinates (mock data for now)
            booking.setPickupLatitude(null);
            booking.setPickupLongitude(null);
            booking.setDropoffLatitude(null);
            booking.setDropoffLongitude(null);
            
            Booking savedBooking = bookingService.createBooking(booking);
            System.out.println("BOOKING CREATED SUCCESSFULLY: " + savedBooking.getId());
            
            // Prepare success response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Booking created successfully");
            response.put("booking", savedBooking);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to create booking: " + e.getMessage());
            System.out.println("BOOKING CREATION ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Get all bookings
    @GetMapping
    public ResponseEntity<?> getAllBookings() {
        System.out.println("=== GET ALL BOOKINGS REQUEST ===");
        
        try {
            List<Booking> allBookings = bookingService.getAllBookings();
            System.out.println("FOUND " + allBookings.size() + " TOTAL BOOKINGS");

            // Convert to simplified DTOs to avoid lazy-loading / serialization problems
            List<Map<String, Object>> simple = allBookings.stream().map(b -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", b.getId());
                m.put("customerId", b.getCustomer() != null ? b.getCustomer().getId() : null);
                m.put("vehicleId", b.getVehicle() != null ? b.getVehicle().getId() : null);
                m.put("pickupAddress", b.getPickupAddress());
                m.put("dropoffAddress", b.getDropoffAddress());
                m.put("estimatedCost", b.getEstimatedCost());
                m.put("status", b.getStatus());
                m.put("paymentStatus", b.getPaymentStatus());
                m.put("actualPickupTime", b.getActualPickupTime() != null ? b.getActualPickupTime().toString() : null);
                m.put("actualDropoffTime", b.getActualDropoffTime() != null ? b.getActualDropoffTime().toString() : null);
                m.put("createdAt", b.getCreatedAt() != null ? b.getCreatedAt().toString() : null);
                return m;
            }).toList();

            Map<String, Object> response = new HashMap<>();
            response.put("message", "All bookings retrieved successfully");
            response.put("bookings", simple);
            response.put("count", simple.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch all bookings: " + e.getMessage());
            System.out.println("ALL BOOKINGS ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Get bookings by customer ID
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<?> getCustomerBookings(@PathVariable Long customerId) {
        System.out.println("=== GET CUSTOMER BOOKINGS REQUEST ===");
        System.out.println("Customer ID: " + customerId);
        
        try {
            // Validate customer exists
            User customer = userRepository.findById(customerId).orElse(null);
            if (customer == null) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Customer not found with ID: " + customerId);
                System.out.println("CUSTOMER NOT FOUND: " + customerId);
                return ResponseEntity.badRequest().body(error);
            }
            
            // Get all bookings and filter by customer
            List<Booking> allBookings = bookingService.getAllBookings();
            List<Booking> customerBookings = allBookings.stream()
                .filter(booking -> booking.getCustomer().getId().equals(customerId))
                .collect(Collectors.toList());
            
            System.out.println("FOUND " + customerBookings.size() + " BOOKINGS FOR CUSTOMER: " + customerId);
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bookings retrieved successfully");
            response.put("bookings", customerBookings);
            response.put("count", customerBookings.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to fetch customer bookings: " + e.getMessage());
            System.out.println("CUSTOMER BOOKINGS ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Get vehicle recommendations for booking
    @PostMapping(value = "/recommendations", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> getVehicleRecommendations(@RequestBody Map<String, Object> criteria) {
        System.out.println("=== VEHICLE RECOMMENDATIONS REQUEST ===");
        System.out.println("Criteria: " + criteria);
        
        try {
            // Extract and validate criteria
            String vehicleType = extractString(criteria, "vehicleType", "Vehicle type");
            Integer passengerCount = extractInteger(criteria, "passengerCount", 1);
            Boolean evPreference = criteria.get("evPreference") != null ? 
                Boolean.valueOf(criteria.get("evPreference").toString()) : false;
            
            // Validate passenger count
            if (passengerCount < 1 || passengerCount > 8) {
                Map<String, String> error = new HashMap<>();
                error.put("message", "Passenger count must be between 1 and 8");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate vehicle type if provided
            if (vehicleType != null && !vehicleType.trim().isEmpty()) {
                String normalizedType = vehicleType.trim().toUpperCase();
                if (!normalizedType.equals("SEDAN") && !normalizedType.equals("SUV") && !normalizedType.equals("EV")) {
                    Map<String, String> error = new HashMap<>();
                    error.put("message", "Invalid vehicle type. Must be one of: SEDAN, SUV, EV");
                    return ResponseEntity.badRequest().body(error);
                }
                vehicleType = normalizedType;
            }
            
            List<Vehicle> recommendations = vehicleService.getVehicleRecommendations(vehicleType, passengerCount, evPreference);
            System.out.println("RECOMMENDATIONS FOUND: " + recommendations.size() + " vehicles");
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Vehicle recommendations retrieved successfully");
            response.put("count", recommendations.size());
            response.put("vehicles", recommendations);
            
            return ResponseEntity.ok(response);
            
        } catch (NumberFormatException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Invalid number format: " + e.getMessage());
            System.out.println("RECOMMENDATIONS FAILED: Number format error - " + e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Failed to get vehicle recommendations: " + e.getMessage());
            System.out.println("RECOMMENDATIONS ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(error);
        }
    }

    // Helper methods for safe data extraction
    private Long extractLong(Map<String, Object> data, String key) {
        return extractLong(data, key, null);
    }
    
    private Long extractLong(Map<String, Object> data, String key, Long defaultValue) {
        Object value = data.get(key);
        if (value == null) return defaultValue;
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException e) {
            throw new NumberFormatException(key + " must be a valid number");
        }
    }
    
    private Integer extractInteger(Map<String, Object> data, String key) {
        return extractInteger(data, key, null);
    }
    
    private Integer extractInteger(Map<String, Object> data, String key, Integer defaultValue) {
        Object value = data.get(key);
        if (value == null) return defaultValue;
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            throw new NumberFormatException(key + " must be a valid number");
        }
    }
    
    private String extractString(Map<String, Object> data, String key) {
        return extractString(data, key, "");
    }
    
    private String extractString(Map<String, Object> data, String key, String defaultValue) {
        Object value = data.get(key);
        if (value == null) return defaultValue;
        return value.toString();
    }
    
    private Double extractDouble(Map<String, Object> data, String key) {
        return extractDouble(data, key, null);
    }
    
    private Double extractDouble(Map<String, Object> data, String key, Double defaultValue) {
        Object value = data.get(key);
        if (value == null) return defaultValue;
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            throw new NumberFormatException(key + " must be a valid number");
        }
    }
}
