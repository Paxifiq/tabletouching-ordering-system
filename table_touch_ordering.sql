-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 06, 2026 at 05:08 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `table_touch_ordering`
--

-- --------------------------------------------------------

--
-- Table structure for table `customer_codes`
--

CREATE TABLE `customer_codes` (
  `id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `status` enum('0','1','2','3') DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `table_no` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customer_codes`
--

INSERT INTO `customer_codes` (`id`, `code`, `status`, `created_at`, `table_no`) VALUES
(155, '11TSOKV6', '1', '2026-05-31 11:46:58', 4),
(156, '2X4K779I', '1', '2026-05-31 11:55:15', 5),
(157, 'Z9WVU1E4', '1', '2026-05-31 12:09:16', 6);

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `image` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `type` enum('food','drink') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`id`, `name`, `image`, `description`, `price`, `type`) VALUES
(14, 'Burger', '/api/uploads/1779465258091-653662777-Burger.webp', 'Delicious beef burger with lettuce, tomato, and cheese', 8000.00, 'food'),
(15, 'Jollof rice', '/api/uploads/1779465412851-267691411-Jollof-rice.jpg', 'A rice dish from West Africa. The dish is made with long-grain rice, tomatoes, chiles, onions, and spices.', 15000.00, 'food'),
(16, 'Pizza', '/api/uploads/1779465790227-730715674-Pizza.jpg', 'Classic margherita pizza with fresh mozzarella and basil', 7000.00, 'food'),
(17, 'salad', '/api/uploads/1779465871813-805842900-Salad.jpg', 'Healthy green salad with cucumbers, tomatoes, and vinaigrette', 5000.00, 'food'),
(18, 'Pasta', '/api/uploads/1779465942039-662262900-Pasta.jpg', 'Spaghetti with homemade marinara sauce and parmesan', 6000.00, 'food'),
(19, 'Fried chicken', '/api/uploads/1779466034766-675142740-Fried Chicken.jpg', 'Crispy fried chicken served with a side of fries', 20000.00, 'food'),
(20, 'Coca Cola', '/api/uploads/1779466111497-270870477-Coca-cola.jpg', 'Chilled Coca Cola can', 1000.00, 'drink'),
(21, 'Heineken', '/api/uploads/1779466183101-377286140-Heineken.jpg', 'Heineken (355 mL) contains 5% alcohol', 2500.00, 'drink'),
(22, 'Orange juice', '/api/uploads/1779466388702-741772603-Orange juice.jpg', 'Freshly squeezed orange juice', 4500.00, 'drink'),
(23, 'Coffee', '/api/uploads/1779466447958-528870148-Coffee.jpg', 'Hot brewed coffee with cream and sugar', 3000.00, 'drink'),
(24, 'Tea', '/api/uploads/1779466533091-328683070-Tea.jpg', 'Refreshing hot tea with lemon', 3000.00, 'drink'),
(25, 'Nile Water', '/api/uploads/1779466645002-555708213-Nile.jpg', 'Pure and fresh Water', 100.00, 'drink'),
(26, 'Sushi', '/api/uploads/1779557935662-577206712-Sushi.jpg', 'This crispy deep-fried tempura roll is sure to delight—especially the crunchy grilled mushroom', 10000.00, 'food');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_code` varchar(10) NOT NULL,
  `table_no` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('pending','completed') DEFAULT 'pending',
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `paid` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_code`, `table_no`, `total_price`, `status`, `order_date`, `paid`) VALUES
(7, 'RL7JAIYL', 1, 15500.00, 'pending', '2026-05-20 16:24:01', 0),
(8, 'JMV5SIB0', 1, 17500.00, 'completed', '2026-05-20 16:35:49', 0),
(9, 'FU8GETUK', 1, 9000.00, 'completed', '2026-05-20 16:40:39', 0),
(10, '3WW61SEN', 1, 33000.00, 'pending', '2026-05-20 17:28:43', 0),
(11, '3WW61SEN', 1, 8000.00, 'pending', '2026-05-20 17:30:38', 0),
(12, 'FU8GETUK', 1, 7000.00, 'completed', '2026-05-20 17:57:33', 0),
(13, 'AU1C9SKY', 1, 22000.00, 'completed', '2026-05-22 16:30:42', 1),
(14, 'PX68E6CL', 1, 10500.00, 'completed', '2026-05-22 19:33:11', 1),
(15, '869C7OHJ', 1, 22000.00, 'completed', '2026-05-24 10:23:02', 0),
(16, 'Q9KBZ7LJ', 1, 22000.00, 'completed', '2026-05-24 16:18:57', 1),
(17, 'GIHYQSV7', 1, 7000.00, 'completed', '2026-05-31 11:11:33', 0),
(18, 'GIHYQSV7', 1, 1.00, 'completed', '2026-05-31 11:15:47', 0),
(19, '11TSOKV6', 1, 1.00, 'completed', '2026-05-31 11:47:14', 0),
(20, '2X4K779I', 1, 100.00, 'completed', '2026-05-31 11:55:30', 1),
(21, 'Z9WVU1E4', 1, 100.00, 'completed', '2026-05-31 12:09:34', 1);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('pending','ready','delivered') DEFAULT 'pending',
  `ready_time` int(6) DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ready_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_id`, `quantity`, `status`, `ready_time`, `delivered_at`, `created_at`, `ready_at`) VALUES
(15, 8, 2, 1, 'delivered', 5, '2026-05-20 16:36:17', '2026-05-20 16:35:49', NULL),
(16, 8, 8, 1, 'delivered', 3, '2026-05-20 16:37:09', '2026-05-20 16:35:49', NULL),
(17, 9, 1, 1, 'delivered', 5, '2026-05-20 16:47:36', '2026-05-20 16:40:39', NULL),
(18, 9, 7, 1, 'delivered', 5, '2026-05-20 16:47:04', '2026-05-20 16:40:39', NULL),
(19, 10, 2, 2, 'delivered', 10, '2026-05-20 18:04:03', '2026-05-20 17:28:43', NULL),
(20, 10, 11, 1, 'pending', NULL, NULL, '2026-05-20 17:28:43', NULL),
(21, 11, 3, 1, 'pending', NULL, NULL, '2026-05-20 17:30:38', NULL),
(22, 11, 12, 1, 'pending', NULL, NULL, '2026-05-20 17:30:38', NULL),
(23, 12, 3, 1, 'delivered', 5, '2026-05-20 18:04:02', '2026-05-20 17:57:33', NULL),
(24, 13, 15, 1, 'delivered', 1, '2026-05-22 19:21:50', '2026-05-22 16:30:42', NULL),
(25, 13, 16, 1, 'delivered', 1, '2026-05-22 19:21:52', '2026-05-22 16:30:42', NULL),
(26, 14, 14, 1, 'delivered', 1, '2026-05-22 19:36:26', '2026-05-22 19:33:11', NULL),
(27, 14, 21, 1, 'delivered', 1, '2026-05-22 19:36:43', '2026-05-22 19:33:11', NULL),
(28, 15, 16, 1, 'delivered', 1, '2026-05-31 12:25:59', '2026-05-24 10:23:02', NULL),
(29, 15, 15, 1, 'delivered', 1, '2026-05-31 12:26:00', '2026-05-24 10:23:02', NULL),
(30, 16, 16, 1, 'delivered', 1, '2026-05-24 16:43:27', '2026-05-24 16:18:57', NULL),
(31, 16, 15, 1, 'delivered', 1, '2026-05-24 16:33:46', '2026-05-24 16:18:57', NULL),
(32, 17, 16, 1, 'delivered', 1, '2026-05-31 11:13:21', '2026-05-31 11:11:33', NULL),
(33, 18, 25, 1, 'delivered', 1, '2026-05-31 11:32:48', '2026-05-31 11:15:47', NULL),
(34, 19, 25, 1, 'delivered', 1, '2026-05-31 11:52:43', '2026-05-31 11:47:14', NULL),
(35, 20, 25, 1, 'delivered', 1, '2026-05-31 11:58:08', '2026-05-31 11:55:30', NULL),
(36, 21, 25, 1, 'delivered', 1, '2026-05-31 12:11:18', '2026-05-31 12:09:34', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `customer_code` varchar(50) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `customer_code`, `phone_number`, `amount`, `payment_date`) VALUES
(1, 'AU1C9SKY ', '0783999892', 22000.00, '2026-05-22 19:22:08'),
(2, 'PX68E6CL', '0783999892', 10500.00, '2026-05-22 19:37:26'),
(3, 'Q9KBZ7LJ', '0783999892', 22000.00, '2026-05-24 16:44:25'),
(4, 'Z9WVU1E4', '0783999892', 100.00, '2026-05-31 12:19:37'),
(5, '2X4K779I', '0783999892', 100.00, '2026-05-31 12:24:47'),
(6, '2X4K779I', '0783999892', 100.00, '2026-05-31 12:24:48');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('receptionist','cook','barman','manager') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'niyo', '123', 'receptionist'),
(2, 'pedro', '123', 'barman'),
(3, 'djallah', '123', 'cook'),
(4, 'manager', '123', 'manager');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customer_codes`
--
ALTER TABLE `customer_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code_unique` (`code`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id_idx` (`order_id`),
  ADD KEY `menu_id_idx` (`menu_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username_unique` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customer_codes`
--
ALTER TABLE `customer_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
