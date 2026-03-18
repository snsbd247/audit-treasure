
-- Units
INSERT INTO public.units (id, name, abbreviation) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Pieces', 'pcs'),
  ('a0000001-0000-0000-0000-000000000002', 'Kilogram', 'kg'),
  ('a0000001-0000-0000-0000-000000000003', 'Liter', 'ltr'),
  ('a0000001-0000-0000-0000-000000000004', 'Meter', 'mtr')
ON CONFLICT DO NOTHING;

-- Item Categories
INSERT INTO public.item_categories (id, name, description) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'Electronics', 'Electronic items'),
  ('b0000001-0000-0000-0000-000000000002', 'Stationery', 'Office supplies'),
  ('b0000001-0000-0000-0000-000000000003', 'Furniture', 'Office furniture')
ON CONFLICT DO NOTHING;

-- Customers
INSERT INTO public.customers (id, name, phone, email, address, status) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Ahmed Trading Co.', '+880-1711-111111', 'ahmed@trading.com', '123 Main St, Dhaka', 'active'),
  ('c0000001-0000-0000-0000-000000000002', 'Bismillah Enterprises', '+880-1722-222222', 'bismillah@ent.com', '45 Market Road, Chittagong', 'active'),
  ('c0000001-0000-0000-0000-000000000003', 'City Electronics', '+880-1733-333333', 'city@electronics.com', '78 Tech Ave, Sylhet', 'active'),
  ('c0000001-0000-0000-0000-000000000004', 'Delta Supplies', '+880-1744-444444', 'delta@supplies.com', '12 Commerce Rd, Rajshahi', 'active'),
  ('c0000001-0000-0000-0000-000000000005', 'Eagle Mart', '+880-1755-555555', 'eagle@mart.com', '90 Plaza Lane, Khulna', 'active')
ON CONFLICT DO NOTHING;

-- Suppliers
INSERT INTO public.suppliers (id, name, phone, email, address, status) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Global Tech Distributors', '+880-1811-111111', 'global@tech.com', '200 Industry Rd, Dhaka', 'active'),
  ('d0000001-0000-0000-0000-000000000002', 'Star Office Supplies', '+880-1822-222222', 'star@office.com', '55 Wholesale Blvd, Gazipur', 'active'),
  ('d0000001-0000-0000-0000-000000000003', 'Royal Furniture House', '+880-1833-333333', 'royal@furniture.com', '88 Craft St, Narayanganj', 'active')
ON CONFLICT DO NOTHING;

-- Items
INSERT INTO public.item_master (id, item_code, item_name, item_type, category_id, unit_id, cost_price, selling_price, min_stock_level, opening_stock, status) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'ITEM-001', 'Laptop HP ProBook', 'product', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 45000, 55000, 5, 20, 'active'),
  ('e0000001-0000-0000-0000-000000000002', 'ITEM-002', 'Wireless Mouse', 'product', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 350, 550, 20, 100, 'active'),
  ('e0000001-0000-0000-0000-000000000003', 'ITEM-003', 'A4 Paper Ream', 'product', 'b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 280, 380, 50, 200, 'active'),
  ('e0000001-0000-0000-0000-000000000004', 'ITEM-004', 'Office Chair Executive', 'product', 'b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 8000, 12000, 3, 15, 'active'),
  ('e0000001-0000-0000-0000-000000000005', 'ITEM-005', 'USB Flash Drive 32GB', 'product', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 200, 350, 30, 150, 'active'),
  ('e0000001-0000-0000-0000-000000000006', 'ITEM-006', 'Desk Lamp LED', 'product', 'b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 600, 950, 10, 50, 'active')
ON CONFLICT DO NOTHING;

-- Sales Invoices
INSERT INTO public.sales_invoices (id, invoice_number, invoice_date, customer_id, total_amount, discount, net_amount, status) VALUES
  ('f0000001-0000-0000-0000-000000000001', 'SI-2026-001', '2026-01-15', 'c0000001-0000-0000-0000-000000000001', 165000, 5000, 160000, 'completed'),
  ('f0000001-0000-0000-0000-000000000002', 'SI-2026-002', '2026-01-22', 'c0000001-0000-0000-0000-000000000001', 24000, 0, 24000, 'completed'),
  ('f0000001-0000-0000-0000-000000000003', 'SI-2026-003', '2026-02-05', 'c0000001-0000-0000-0000-000000000002', 55000, 0, 55000, 'completed'),
  ('f0000001-0000-0000-0000-000000000004', 'SI-2026-004', '2026-02-12', 'c0000001-0000-0000-0000-000000000002', 7600, 0, 7600, 'completed'),
  ('f0000001-0000-0000-0000-000000000005', 'SI-2026-005', '2026-02-20', 'c0000001-0000-0000-0000-000000000003', 36000, 1000, 35000, 'completed'),
  ('f0000001-0000-0000-0000-000000000006', 'SI-2026-006', '2026-03-01', 'c0000001-0000-0000-0000-000000000004', 11400, 0, 11400, 'completed'),
  ('f0000001-0000-0000-0000-000000000007', 'SI-2026-007', '2026-03-10', 'c0000001-0000-0000-0000-000000000005', 5500, 0, 5500, 'completed')
ON CONFLICT DO NOTHING;

-- Sales Invoice Items
INSERT INTO public.sales_invoice_items (sales_invoice_id, product_id, quantity, price, discount, total) VALUES
  ('f0000001-0000-0000-0000-000000000001', 'e0000001-0000-0000-0000-000000000001', 3, 55000, 0, 165000),
  ('f0000001-0000-0000-0000-000000000002', 'e0000001-0000-0000-0000-000000000004', 2, 12000, 0, 24000),
  ('f0000001-0000-0000-0000-000000000003', 'e0000001-0000-0000-0000-000000000001', 1, 55000, 0, 55000),
  ('f0000001-0000-0000-0000-000000000004', 'e0000001-0000-0000-0000-000000000003', 20, 380, 0, 7600),
  ('f0000001-0000-0000-0000-000000000005', 'e0000001-0000-0000-0000-000000000004', 3, 12000, 0, 36000),
  ('f0000001-0000-0000-0000-000000000006', 'e0000001-0000-0000-0000-000000000006', 12, 950, 0, 11400),
  ('f0000001-0000-0000-0000-000000000007', 'e0000001-0000-0000-0000-000000000002', 10, 550, 0, 5500);

-- Purchases
INSERT INTO public.purchases (id, purchase_number, purchase_date, supplier_id, total_amount, status, payment_method) VALUES
  ('a1b2c3d4-0001-4000-a000-000000000001', 'PO-2026-001', '2026-01-10', 'd0000001-0000-0000-0000-000000000001', 225000, 'completed', 'bank'),
  ('a1b2c3d4-0002-4000-a000-000000000002', 'PO-2026-002', '2026-01-18', 'd0000001-0000-0000-0000-000000000002', 14000, 'completed', 'cash'),
  ('a1b2c3d4-0003-4000-a000-000000000003', 'PO-2026-003', '2026-02-01', 'd0000001-0000-0000-0000-000000000003', 40000, 'completed', 'bank'),
  ('a1b2c3d4-0004-4000-a000-000000000004', 'PO-2026-004', '2026-02-15', 'd0000001-0000-0000-0000-000000000001', 10000, 'completed', 'cash'),
  ('a1b2c3d4-0005-4000-a000-000000000005', 'PO-2026-005', '2026-03-01', 'd0000001-0000-0000-0000-000000000002', 5600, 'completed', 'cash');

-- Purchase Items
INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_price, total) VALUES
  ('a1b2c3d4-0001-4000-a000-000000000001', 'e0000001-0000-0000-0000-000000000001', 5, 45000, 225000),
  ('a1b2c3d4-0002-4000-a000-000000000002', 'e0000001-0000-0000-0000-000000000003', 50, 280, 14000),
  ('a1b2c3d4-0003-4000-a000-000000000003', 'e0000001-0000-0000-0000-000000000004', 5, 8000, 40000),
  ('a1b2c3d4-0004-4000-a000-000000000004', 'e0000001-0000-0000-0000-000000000002', 50, 200, 10000),
  ('a1b2c3d4-0005-4000-a000-000000000005', 'e0000001-0000-0000-0000-000000000003', 20, 280, 5600);

-- Customer Payments
INSERT INTO public.party_payments (id, party_type, party_id, payment_date, amount, payment_method, reference, notes) VALUES
  ('aa000001-0000-4000-a000-000000000001', 'customer', 'c0000001-0000-0000-0000-000000000001', '2026-01-20', 100000, 'bank', 'TXN-001', 'Partial payment for SI-2026-001'),
  ('aa000001-0000-4000-a000-000000000002', 'customer', 'c0000001-0000-0000-0000-000000000001', '2026-02-01', 60000, 'bank', 'TXN-002', 'Remaining for SI-2026-001'),
  ('aa000001-0000-4000-a000-000000000003', 'customer', 'c0000001-0000-0000-0000-000000000001', '2026-02-10', 24000, 'cash', 'CASH-001', 'Full payment SI-2026-002'),
  ('aa000001-0000-4000-a000-000000000004', 'customer', 'c0000001-0000-0000-0000-000000000002', '2026-02-15', 40000, 'bank', 'TXN-003', 'Partial payment'),
  ('aa000001-0000-4000-a000-000000000005', 'customer', 'c0000001-0000-0000-0000-000000000003', '2026-03-01', 20000, 'cheque', 'CHQ-101', 'Advance payment'),
  ('aa000001-0000-4000-a000-000000000006', 'customer', 'c0000001-0000-0000-0000-000000000005', '2026-03-12', 5500, 'cash', 'CASH-002', 'Full payment');

-- Supplier Payments
INSERT INTO public.party_payments (id, party_type, party_id, payment_date, amount, payment_method, reference, notes) VALUES
  ('aa000001-0000-4000-a000-000000000007', 'supplier', 'd0000001-0000-0000-0000-000000000001', '2026-01-15', 200000, 'bank', 'PAY-001', 'Payment for PO-2026-001'),
  ('aa000001-0000-4000-a000-000000000008', 'supplier', 'd0000001-0000-0000-0000-000000000002', '2026-01-25', 14000, 'cash', 'CASH-003', 'Full payment PO-2026-002'),
  ('aa000001-0000-4000-a000-000000000009', 'supplier', 'd0000001-0000-0000-0000-000000000003', '2026-02-10', 30000, 'bank', 'PAY-002', 'Partial payment');

-- Payment Allocations (Customer)
INSERT INTO public.payment_allocations (payment_id, invoice_type, invoice_id, allocated_amount) VALUES
  ('aa000001-0000-4000-a000-000000000001', 'sales_invoice', 'f0000001-0000-0000-0000-000000000001', 100000),
  ('aa000001-0000-4000-a000-000000000002', 'sales_invoice', 'f0000001-0000-0000-0000-000000000001', 60000),
  ('aa000001-0000-4000-a000-000000000003', 'sales_invoice', 'f0000001-0000-0000-0000-000000000002', 24000),
  ('aa000001-0000-4000-a000-000000000004', 'sales_invoice', 'f0000001-0000-0000-0000-000000000003', 40000),
  ('aa000001-0000-4000-a000-000000000005', 'sales_invoice', 'f0000001-0000-0000-0000-000000000005', 20000),
  ('aa000001-0000-4000-a000-000000000006', 'sales_invoice', 'f0000001-0000-0000-0000-000000000007', 5500);

-- Payment Allocations (Supplier)
INSERT INTO public.payment_allocations (payment_id, invoice_type, invoice_id, allocated_amount) VALUES
  ('aa000001-0000-4000-a000-000000000007', 'purchase', 'a1b2c3d4-0001-4000-a000-000000000001', 200000),
  ('aa000001-0000-4000-a000-000000000008', 'purchase', 'a1b2c3d4-0002-4000-a000-000000000002', 14000),
  ('aa000001-0000-4000-a000-000000000009', 'purchase', 'a1b2c3d4-0003-4000-a000-000000000003', 30000);

-- Notes
INSERT INTO public.party_notes (party_type, party_id, note) VALUES
  ('customer', 'c0000001-0000-0000-0000-000000000001', 'VIP customer - always pays on time. Preferred bank transfer.'),
  ('customer', 'c0000001-0000-0000-0000-000000000002', 'Requested bulk discount for next order.'),
  ('supplier', 'd0000001-0000-0000-0000-000000000001', 'Best prices on electronics. 30-day credit terms.');
