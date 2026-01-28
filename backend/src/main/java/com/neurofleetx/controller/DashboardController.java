package com.neurofleetx.controller;

import com.neurofleetx.entity.Booking;
import com.neurofleetx.entity.User;
import com.neurofleetx.entity.UserRole;
import com.neurofleetx.repository.BookingRepository;
import com.neurofleetx.repository.UserRepository;
import com.neurofleetx.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class DashboardController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/admin/metrics")
    public Map<String, Object> getAdminMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        long totalUsers = userRepository.count();
        long totalVehicles = vehicleRepository.count();
        long totalBookings = bookingRepository.count();
        long activeBookings = bookingRepository.findActiveBookings().size();
        long completedTrips = bookingRepository.findCompletedBookings().size();
        Double revenue = bookingRepository.calculateTotalRevenue();

        metrics.put("totalUsers", totalUsers);
        metrics.put("totalVehicles", totalVehicles);
        metrics.put("totalBookings", totalBookings);
        metrics.put("activeBookings", activeBookings);
        metrics.put("completedTrips", completedTrips);
        metrics.put("totalRevenue", revenue == null ? 0.0 : revenue);
        return metrics;
    }

    @GetMapping("/fleet-manager/metrics")
    public Map<String, Object> getFleetManagerMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        long activeVehicles = vehicleRepository.findByIsAvailableTrue().size();
        long totalFleetSize = vehicleRepository.count();
        long activeTrips = bookingRepository.findActiveBookings().size();
        long completedTrips = bookingRepository.findCompletedBookings().size();

        // Count active drivers
        List<User> allUsers = userRepository.findAll();
        long activeDrivers = allUsers.stream()
                .filter(u -> u.getRole() == UserRole.DRIVER && u.isActive())
                .count();

        Double weeklyRevenue = bookingRepository.calculateTotalRevenue();

        metrics.put("activeVehicles", activeVehicles);
        metrics.put("totalFleetSize", totalFleetSize);
        metrics.put("activeTrips", activeTrips);
        metrics.put("completedTrips", completedTrips);
        metrics.put("activeDrivers", activeDrivers);
        metrics.put("weeklyRevenue", weeklyRevenue == null ? 0.0 : weeklyRevenue);
        return metrics;
    }

    @GetMapping("/driver/metrics")
    public Map<String, Object> getDriverMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // Today's date range
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.atTime(LocalTime.MAX);

        List<Booking> todays = bookingRepository.findBookingsInDateRange(startOfDay, endOfDay);

        int todaysTrips = todays.size();
        double todaysEarnings = todays.stream()
                .filter(b -> b.getPaymentStatus() != null && b.getPaymentStatus().equalsIgnoreCase("PAID"))
                .mapToDouble(b -> b.getEstimatedCost() == null ? 0.0 : b.getEstimatedCost())
                .sum();

        double distanceCovered = todays.stream()
                .filter(b -> b.getActualDistance() != null)
                .mapToDouble(b -> b.getActualDistance())
                .sum();

        double driverRating = bookingRepository.findCompletedBookings().stream()
                .filter(b -> b.getDriverRating() != null)
                .mapToInt(b -> b.getDriverRating())
                .average().orElse(0.0);

        long completedTrips = bookingRepository.countByStatus("COMPLETED");

        // acceptance rate = percent of bookings that have a driver assigned
        long totalBookings = bookingRepository.count();
        long bookingsWithDriver = bookingRepository.findActiveBookings().stream().filter(b -> b.getDriver() != null).count();
        double acceptanceRate = totalBookings == 0 ? 0.0 : (bookingsWithDriver * 100.0 / (double) totalBookings);

        metrics.put("todaysTrips", todaysTrips);
        metrics.put("todaysEarnings", todaysEarnings);
        metrics.put("distanceCovered", distanceCovered);
        metrics.put("driverRating", Math.round(driverRating * 10.0) / 10.0);
        metrics.put("completedTrips", completedTrips);
        metrics.put("acceptanceRate", Math.round(acceptanceRate * 10.0) / 10.0);

        return metrics;
    }

    @GetMapping("/customer/metrics")
    public Map<String, Object> getCustomerMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        long activeBookings = bookingRepository.findActiveBookings().size();
        long totalTrips = bookingRepository.count();
        Double totalSpent = bookingRepository.calculateTotalRevenue();

        metrics.put("activeBookings", activeBookings);
        metrics.put("totalTrips", totalTrips);
        metrics.put("totalSpent", totalSpent == null ? 0.0 : totalSpent);
        metrics.put("amountSaved", 0.0);
        metrics.put("upcomingTrips", 0);
        metrics.put("favoriteRoutes", 0);

        return metrics;
    }
}
