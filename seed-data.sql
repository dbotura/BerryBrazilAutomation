-- Sample data for Berry Brazil Açai Stock Management
-- Run this AFTER running schema.sql

-- Insert Categories
INSERT INTO categories (name, description) VALUES
('Bowls', 'Açai bowls in various sizes'),
('Smoothies', 'Açai smoothies and drinks'),
('Powder', 'Açai powder products'),
('Frozen Packs', 'Frozen açai packs for resale'),
('Toppings', 'Bowl toppings and extras')
ON CONFLICT DO NOTHING;

-- Insert Products
INSERT INTO products (name, price, stock, min_stock, category_id, unit) VALUES
('Açai Bowl 300g', 15.00, 45, 10, (SELECT id FROM categories WHERE name = 'Bowls'), 'unit'),
('Açai Bowl 500g', 22.00, 32, 10, (SELECT id FROM categories WHERE name = 'Bowls'), 'unit'),
('Açai Smoothie 400ml', 12.00, 28, 15, (SELECT id FROM categories WHERE name = 'Smoothies'), 'unit'),
('Açai Powder 100g', 35.00, 8, 5, (SELECT id FROM categories WHERE name = 'Powder'), 'unit'),
('Açai Frozen Pack 1kg', 45.00, 15, 8, (SELECT id FROM categories WHERE name = 'Frozen Packs'), 'kg'),
('Granola Topping', 3.50, 50, 20, (SELECT id FROM categories WHERE name = 'Toppings'), 'unit'),
('Fresh Strawberries', 4.00, 25, 10, (SELECT id FROM categories WHERE name = 'Toppings'), 'unit'),
('Banana Slices', 2.50, 30, 15, (SELECT id FROM categories WHERE name = 'Toppings'), 'unit'),
('Honey Drizzle', 2.00, 40, 15, (SELECT id FROM categories WHERE name = 'Toppings'), 'unit'),
('Coconut Flakes', 3.00, 35, 12, (SELECT id FROM categories WHERE name = 'Toppings'), 'unit')
ON CONFLICT DO NOTHING;

-- Insert some sample stock movements
INSERT INTO stock_movements (product_id, type, quantity, previous_stock, new_stock, reason, performed_by, date) VALUES
((SELECT id FROM products WHERE name = 'Açai Bowl 300g'), 'in', 50, 0, 50, 'Initial stock', 'System', NOW() - INTERVAL '7 days'),
((SELECT id FROM products WHERE name = 'Açai Bowl 300g'), 'out', 5, 50, 45, 'Sales', 'System', NOW() - INTERVAL '5 days'),
((SELECT id FROM products WHERE name = 'Açai Bowl 500g'), 'in', 40, 0, 40, 'Initial stock', 'System', NOW() - INTERVAL '7 days'),
((SELECT id FROM products WHERE name = 'Açai Bowl 500g'), 'out', 8, 40, 32, 'Sales', 'System', NOW() - INTERVAL '4 days'),
((SELECT id FROM products WHERE name = 'Açai Smoothie 400ml'), 'in', 35, 0, 35, 'Initial stock', 'System', NOW() - INTERVAL '6 days'),
((SELECT id FROM products WHERE name = 'Açai Smoothie 400ml'), 'out', 7, 35, 28, 'Sales', 'System', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Insert sample sales
INSERT INTO sales (total, status, customer, date) VALUES
(49.00, 'completed', 'Walk-in Customer', NOW() - INTERVAL '5 days'),
(78.00, 'completed', 'Maria Silva', NOW() - INTERVAL '4 days'),
(36.00, 'completed', 'João Santos', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Insert sale items for the first sale
INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, subtotal)
SELECT 
  (SELECT id FROM sales ORDER BY date LIMIT 1),
  p.id,
  p.name,
  2,
  p.price,
  p.price * 2
FROM products p
WHERE p.name = 'Açai Bowl 300g'
ON CONFLICT DO NOTHING;

INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, subtotal)
SELECT 
  (SELECT id FROM sales ORDER BY date LIMIT 1),
  p.id,
  p.name,
  1,
  p.price,
  p.price
FROM products p
WHERE p.name = 'Granola Topping'
ON CONFLICT DO NOTHING;

-- Verify data
SELECT 'Categories:' as info, COUNT(*) as count FROM categories
UNION ALL
SELECT 'Products:', COUNT(*) FROM products
UNION ALL
SELECT 'Stock Movements:', COUNT(*) FROM stock_movements
UNION ALL
SELECT 'Sales:', COUNT(*) FROM sales
UNION ALL
SELECT 'Sale Items:', COUNT(*) FROM sale_items;
