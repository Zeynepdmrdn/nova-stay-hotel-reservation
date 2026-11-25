
-- NOVA STAY - PostgreSQL Database Schema

-- 1. Oda tipleri
CREATE TABLE room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    price_per_night NUMERIC(10,2) NOT NULL
        CHECK (price_per_night > 0),
    description TEXT
);

-- 2. Odalar
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_type_id INTEGER NOT NULL
        REFERENCES room_types(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Misafirler
CREATE TABLE guests (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20)
);

-- 4. Rezervasyonlar
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER NOT NULL
        REFERENCES guests(id),
    room_id INTEGER NOT NULL
        REFERENCES rooms(id),
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_dates
        CHECK (check_out > check_in),

    CONSTRAINT valid_status
        CHECK (status IN (
            'pending',
            'confirmed',
            'cancelled'
        )),

    CONSTRAINT valid_total_price
        CHECK (total_price >= 0)
);
