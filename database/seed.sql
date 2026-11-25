
-- NOVA STAY - Ornek oda verileri

-- Oda tipleri
INSERT INTO room_types
(name, capacity, price_per_night, description)
SELECT v.name, v.capacity, v.price, v.description
FROM (VALUES
  ('Standard Oda', 2, 1800.00,
   'Konforlu ve modern bir konaklama deneyimi.'),

  ('Deluxe Oda', 3, 2900.00,
   'Sik tasarim ve genis yasam alani.'),

  ('Suite Oda', 4, 4500.00,
   'Ayricalikli konfor ve luks konaklama.')
) AS v(name, capacity, price, description)
WHERE NOT EXISTS (
  SELECT 1 FROM room_types rt
  WHERE rt.name = v.name
);

-- Fiziksel otel odalari
INSERT INTO rooms (room_number, room_type_id)
SELECT v.room_number, rt.id
FROM (VALUES
  ('101', 'Standard Oda'),
  ('102', 'Standard Oda'),
  ('201', 'Deluxe Oda'),
  ('202', 'Deluxe Oda'),
  ('301', 'Suite Oda'),
  ('302', 'Suite Oda')
) AS v(room_number, type_name)
JOIN room_types rt ON rt.name = v.type_name
ON CONFLICT (room_number) DO NOTHING;
