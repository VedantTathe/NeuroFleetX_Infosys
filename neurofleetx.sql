-- NeuroFleetX Complete MySQL Setup
-- This script creates the database, all tables, and inserts sample data

-- Create the database
CREATE DATABASE IF NOT EXISTS neurofleetx_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Switch to the new database
USE neurofleetx_db;

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'FLEET_MANAGER', 'DRIVER', 'CUSTOMER') NOT NULL,
    company_name VARCHAR(255),
    license_number VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create vehicles table
CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    driver_id BIGINT,
    make VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    license_plate VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(255) NOT NULL,
    passenger_capacity INT NOT NULL,
    vehicle_year INT NOT NULL,
    color VARCHAR(255) NOT NULL,
    base_price_per_km DECIMAL(10,2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    current_fuel_level DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    fuel_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    battery_level DECIMAL(5,2),
    health_score DECIMAL(5,2) DEFAULT 95.0,
    last_maintenance_date VARCHAR(255),
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_driver_id (driver_id),
    INDEX idx_license_plate (license_plate),
    INDEX idx_type (type),
    INDEX idx_is_available (is_available),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create bookings table
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    driver_id BIGINT,
    pickup_address TEXT NOT NULL,
    dropoff_address TEXT NOT NULL,
    pickup_latitude DECIMAL(10,8),
    pickup_longitude DECIMAL(11,8),
    dropoff_latitude DECIMAL(10,8),
    dropoff_longitude DECIMAL(11,8),
    scheduled_pickup_time TIMESTAMP NULL,
    actual_pickup_time TIMESTAMP NULL,
    actual_dropoff_time TIMESTAMP NULL,
    estimated_distance DECIMAL(10,2),
    actual_distance DECIMAL(10,2),
    estimated_duration DECIMAL(10,2),
    actual_duration DECIMAL(10,2),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    passenger_count INT,
    payment_method VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    promo_code VARCHAR(100),
    discount_amount DECIMAL(10,2) DEFAULT 0.0,
    customer_feedback TEXT,
    driver_rating INT CHECK (driver_rating >= 1 AND driver_rating <= 5),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_vehicle_id (vehicle_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status),
    INDEX idx_scheduled_pickup_time (scheduled_pickup_time),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample users for testing
-- Note: Passwords are BCrypt hashed for 'password123'
INSERT INTO users (name, email, password, role, company_name, license_number, active, created_at, updated_at) VALUES
('Admin User', 'admin@neurofleetx.com', '$2a$10$YourHashedPasswordHere', 'ADMIN', 'NeuroFleetX', 'ADMIN-001', true, NOW(), NOW()),
('Fleet Manager', 'fleet@neurofleetx.com', '$2a$10$YourHashedPasswordHere', 'FLEET_MANAGER', 'NeuroFleetX', 'FLEET-001', true, NOW(), NOW()),
('John Doe', 'customer1@neurofleetx.com', '$2a$10$YourHashedPasswordHere', 'CUSTOMER', 'Personal', 'CUST-001', true, NOW(), NOW()),
('Jane Smith', 'customer2@neurofleetx.com', '$2a$10$YourHashedPasswordHere', 'CUSTOMER', 'Personal', 'CUST-002', true, NOW(), NOW()),
('Mike Wilson', 'driver1@neurofleetx.com', '$2a$10$YourHashedPasswordHere', 'DRIVER', 'NeuroFleetX', 'DRV-001', true, NOW(), NOW()),
('Sarah Johnson', 'driver2@neurofleetx.com', '$2a$10$YourHashedPasswordHere', 'DRIVER', 'NeuroFleetX', 'DRV-002', true, NOW(), NOW());

-- Insert sample vehicles for testing
INSERT INTO vehicles (make, model, license_plate, type, passenger_capacity, vehicle_year, color, base_price_per_km, is_available, current_fuel_level, battery_level, fuel_type, health_score, status, created_at, updated_at) VALUES
('Toyota', 'Camry', 'ABC-123', 'SEDAN', 5, 2022, 'Silver', 0.50, true, 80.0, NULL, 'GASOLINE', 95.0, 'ACTIVE', NOW(), NOW()),
('Honda', 'CR-V', 'XYZ-789', 'SUV', 7, 2023, 'Black', 0.75, true, 90.0, NULL, 'GASOLINE', 92.0, 'ACTIVE', NOW(), NOW()),
('Tesla', 'Model 3', 'EV-001', 'EV', 5, 2023, 'White', 0.60, true, 100.0, 95.0, 'ELECTRIC', 98.0, 'ACTIVE', NOW(), NOW()),
('Ford', 'Mustang', 'MUS-456', 'SEDAN', 4, 2021, 'Red', 0.80, false, 60.0, NULL, 'GASOLINE', 88.0, 'ACTIVE', NOW(), NOW()),
('BMW', 'X5', 'BMW-789', 'SUV', 7, 2022, 'Blue', 0.90, true, 75.0, NULL, 'GASOLINE', 94.0, 'ACTIVE', NOW(), NOW());

-- Assign drivers to vehicles (update driver_id in vehicles table)
UPDATE vehicles SET driver_id = (SELECT id FROM users WHERE email = 'driver1@neurofleetx.com') WHERE license_plate = 'ABC-123';
UPDATE vehicles SET driver_id = (SELECT id FROM users WHERE email = 'driver2@neurofleetx.com') WHERE license_plate = 'XYZ-789';
UPDATE vehicles SET driver_id = (SELECT id FROM users WHERE email = 'driver1@neurofleetx.com') WHERE license_plate = 'EV-001';

-- Insert sample bookings for testing
INSERT INTO bookings (customer_id, vehicle_id, pickup_address, dropoff_address, scheduled_pickup_time, estimated_cost, passenger_count, status, payment_status, created_at, updated_at) VALUES
((SELECT id FROM users WHERE email = 'customer1@neurofleetx.com'), 
 (SELECT id FROM vehicles WHERE license_plate = 'ABC-123'),
 '123 Main St, New York, NY',
 '456 Park Ave, New York, NY',
 DATE_ADD(NOW(), INTERVAL 2 HOUR),
 25.50,
 2,
 'CONFIRMED',
 'PAID',
 NOW(),
 NOW()),
((SELECT id FROM users WHERE email = 'customer2@neurofleetx.com'),
 (SELECT id FROM vehicles WHERE license_plate = 'EV-001'),
 '789 Broadway, New York, NY',
 '321 5th Ave, New York, NY',
 DATE_ADD(NOW(), INTERVAL 4 HOUR),
 35.75,
 1,
 'PENDING',
 'PENDING',
 NOW(),
 NOW()),
((SELECT id FROM users WHERE email = 'customer1@neurofleetx.com'),
 (SELECT id FROM vehicles WHERE license_plate = 'XYZ-789'),
 'Airport Terminal 4, Queens, NY',
 'Times Square, New York, NY',
 DATE_ADD(NOW(), INTERVAL 1 DAY),
 85.00,
 3,
 'COMPLETED',
 'PAID',
 DATE_SUB(NOW(), INTERVAL 1 DAY),
 DATE_SUB(NOW(), INTERVAL 1 DAY));

-- Display setup completion message
SELECT 'NeuroFleetX MySQL setup completed successfully!' AS message;
SELECT * FROM vehicles;
select * from users;
select * from bookings;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_vehicles FROM vehicles;
SELECT COUNT(*) AS total_bookings FROM bookings;
