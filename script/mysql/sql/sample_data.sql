-- 示例用户数据
-- 注意: 密码使用bcrypt加密, 这里是"123456"的加密结果
INSERT INTO `users` (`id`, `avatar`, `nickname`, `phone`, `password`, `status`, `sex`, `created_at`, `updated_at`) 
VALUES 
('10001', 'https://example.com/avatars/avatar1.jpg', '张三', '13800138001', '$2a$10$NqmMbrEUJYPGWoJfnAEoOuo/R1BOuIiqazfFxV66FP6qmgROyxIDa', 1, 1, NOW(), NOW()),
('10002', 'https://example.com/avatars/avatar2.jpg', '李四', '13800138002', '$2a$10$NqmMbrEUJYPGWoJfnAEoOuo/R1BOuIiqazfFxV66FP6qmgROyxIDa', 1, 0, NOW(), NOW()),
('10003', 'https://example.com/avatars/avatar3.jpg', '王五', '13800138003', '$2a$10$NqmMbrEUJYPGWoJfnAEoOuo/R1BOuIiqazfFxV66FP6qmgROyxIDa', 1, 1, NOW(), NOW());

-- 好友关系数据
INSERT INTO `friends` (`user_id`, `friend_uid`, `remark`, `add_source`, `created_at`) 
VALUES 
('10001', '10002', '李四', 0, NOW()),
('10002', '10001', '张三', 0, NOW()),
('10001', '10003', '王五', 0, NOW()),
('10003', '10001', '张三', 0, NOW());

-- 群组数据
INSERT INTO `groups` (`id`, `name`, `icon`, `status`, `creator_uid`, `group_type`, `is_verify`, `notification`, `notification_uid`, `created_at`, `updated_at`) 
VALUES 
('group_001', '测试群聊', 'https://example.com/groups/icon1.jpg', 1, '10001', 0, 0, '欢迎加入测试群聊', '10001', NOW(), NOW());

-- 群成员数据
INSERT INTO `group_members` (`group_id`, `user_id`, `role_level`, `join_time`, `join_source`, `inviter_uid`, `operator_uid`) 
VALUES 
('group_001', '10001', 2, NOW(), 0, NULL, NULL),
('group_001', '10002', 1, NOW(), 0, '10001', '10001'),
('group_001', '10003', 1, NOW(), 0, '10001', '10001');

-- wuid表初始化
INSERT INTO `wuid` (`h`, `x`) VALUES (1, 0) ON DUPLICATE KEY UPDATE `h` = `h`;