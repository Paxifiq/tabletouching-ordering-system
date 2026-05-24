-- Tabletouch Ordering System MySQL initialization script

CREATE DATABASE IF NOT EXISTS `table_touch_ordering` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `table_touch_ordering`;

DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `customer_codes`;
DROP TABLE IF EXISTS `menu`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `customer_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `table_no` int(11) DEFAULT NULL,
  `status` enum('0','1','2','3') DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `menu` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `image` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `type` enum('food','drink') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(10) NOT NULL,
  `table_no` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('pending','completed') DEFAULT 'pending',
  `order_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `paid` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `status` enum('pending','ready','delivered') DEFAULT 'pending',
  `ready_time` int(6) DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `order_id_idx` (`order_id`),
  KEY `menu_id_idx` (`menu_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_code` varchar(50) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('receptionist','cook','barman','manager') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_unique` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `customer_codes` (`code`, `status`) VALUES
('7D20AD68', '1'),
('78320887', '0'),
('9A05CA16', '1'),
('A0059CC2', '1'),
('0ADD5127', '1');

INSERT INTO `menu` (`name`, `image`, `description`, `price`, `type`) VALUES
('Burger', 'burger.jpg', 'Delicious beef burger with lettuce, tomato, and cheese', 8000.00, 'food'),
('Jollof rice', 'Jollof rice.jpg', 'A rice dish from West Africa. The dish is made with long-grain rice, tomatoes, chiles, onions, and spices.', 15000.00, 'food'),
('Pizza', 'pizza.jpg', 'Classic margherita pizza with fresh mozzarella and basil', 7000.00, 'food'),
('Salad', 'salad.jpg', 'Healthy green salad with cucumbers, tomatoes, and vinaigrette', 5000.00, 'food'),
('Pasta', 'pasta.jpg', 'Spaghetti with homemade marinara sauce and parmesan', 6000.00, 'food'),
('Fried chicken', 'fried_chicken.jpg', 'Crispy fried chicken served with a side of fries', 20000.00, 'food'),
('Coca Cola', 'coca_cola.jpg', 'Chilled Coca Cola can', 1000.00, 'drink'),
('Heineken', 'Heineken.jpg', 'Heineken (355 mL) contains 5% alcohol', 2500.00, 'drink'),
('Orange juice', 'orange_juice.jpg', 'Freshly squeezed orange juice', 4500.00, 'drink'),
('Coffee', 'coffee.jpg', 'Hot brewed coffee with cream and sugar', 3000.00, 'drink'),
('Tea', 'tea.jpg', 'Refreshing hot tea with lemon', 3000.00, 'drink'),
('Nile Water', 'NilWater-0004.jpg', 'Pure and fresh Water', 1000.00, 'drink'),
('Water', 'water.jpg', 'Inyange Mineral water', 1200.00, 'drink');

INSERT INTO `users` (`username`, `password`, `role`) VALUES
('niyo', '123', 'receptionist'),
('pedro', '123', 'barman'),
('djallah', '123', 'cook'),
('manager', '123', 'manager');
