SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS profile_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE profile_demo;
CREATE TABLE customer_sample (`客户编号` VARCHAR(30), `姓名` VARCHAR(50), `邮箱` VARCHAR(100), `城市` VARCHAR(50), `订单金额` DECIMAL(12,2), `注册日期` VARCHAR(30));
INSERT INTO customer_sample VALUES
('C001','张三','zhangsan@example.test','北京',120.00,'2026-01-01'),
('C002','李四',NULL,'上海',260.50,'2026-01-02'),
('C003',' 王五 ','wangwu@example.test','深圳',88.00,'2026/01/03'),
('C004','赵六','zhaoliu@example.test',NULL,0.00,'2026-01-04'),
('C005',NULL,'customer5@example.test','杭州',NULL,'2026-01-05'),
('C006','孙七','not-an-email','成都',99.99,'bad-date'),
('C007','周八','','武汉',500.00,NULL),
('C008','吴九','wujiu@example.test',' ',30.00,'2026-01-08'),
('C001','张三','zhangsan@example.test','北京',120.00,'2026-01-01'),
('C002','李四',NULL,'上海',260.50,'2026-01-02');
CREATE USER 'profile_reader'@'%' IDENTIFIED BY 'hqdp_profile_local_only';
GRANT SELECT ON profile_demo.* TO 'profile_reader'@'%';
