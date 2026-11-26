
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 1. Backend kontrolü
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "NOVA STAY Backend calisiyor!"
  });
});

// 2. Oda fotoğrafları
const roomImages = {
  "Standard Oda":
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900",
  "Deluxe Oda":
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900",
  "Suite Oda":
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900"
};

// 3. Odaları PostgreSQL'den getir
app.get("/api/rooms", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        rt.id,
        rt.name,
        rt.description,
        rt.capacity,
        rt.price_per_night AS price,
        COUNT(r.id)::int AS room_count
      FROM room_types rt
      JOIN rooms r ON r.room_type_id = rt.id
      WHERE r.is_active = TRUE
      GROUP BY
        rt.id,
        rt.name,
        rt.description,
        rt.capacity,
        rt.price_per_night
      ORDER BY rt.id
    `);

    const rooms = result.rows.map((room) => ({
      ...room,
      price: Number(room.price),
      image: roomImages[room.name] || ""
    }));

    res.json(rooms);
  } catch (error) {
    console.error("Room API error:", error.message);

    res.status(500).json({
      success: false,
      message: "Odalar veritabanından alınamadı."
    });
  }
});

// 4. PostgreSQL bağlantı kontrolü
app.get("/api/db-health", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT NOW() AS server_time"
    );

    res.json({
      success: true,
      message: "PostgreSQL bağlantısı başarılı!",
      serverTime: result.rows[0].server_time
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      success: false,
      message: "PostgreSQL bağlantısı başarısız."
    });
  }
});

// 5. Tarih doğrulama fonksiyonu
function parseDate(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return date;
}

// 6. Yeni rezervasyon oluşturma
app.post("/api/reservations", async (req, res) => {
  const {
    guestName,
    email,
    phone,
    roomTypeId,
    checkIn,
    checkOut
  } = req.body || {};

  // Misafir ve oda bilgilerini doğrula
  const typeId = Number(roomTypeId);

  if (
    typeof guestName !== "string" ||
    !guestName.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !Number.isSafeInteger(typeId) ||
    typeId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Geçerli misafir ve oda bilgileri giriniz."
    });
  }

  // Tarihleri doğrula
  const start = parseDate(checkIn);
  const end = parseDate(checkOut);

  if (!start || !end || end <= start) {
    return res.status(400).json({
      success: false,
      message: "Giriş ve çıkış tarihleri geçersiz."
    });
  }

  const nights = Math.round(
    (end.getTime() - start.getTime()) / 86400000
  );

  let client;

  try {
    client = await pool.connect();

    // İşlemi başlat
    await client.query("BEGIN");

    // Uygun fiziksel odayı bul
    const available = await client.query(
      `
      SELECT
        r.id,
        r.room_number,
        t.price_per_night
      FROM rooms r
      JOIN room_types t
        ON t.id = r.room_type_id
      WHERE r.room_type_id = $1
        AND r.is_active = TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM reservations b
          WHERE b.room_id = r.id
            AND b.status <> 'cancelled'
            AND b.check_in < $3::date
            AND b.check_out > $2::date
        )
      ORDER BY r.id
      LIMIT 1
      FOR UPDATE OF r SKIP LOCKED
      `,
      [typeId, checkIn, checkOut]
    );

    if (available.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "Seçilen tarihlerde uygun oda bulunamadı."
      });
    }

    const room = available.rows[0];

    // Misafiri veritabanına ekle
    const guest = await client.query(
      `
      INSERT INTO guests
        (full_name, email, phone)
      VALUES ($1, $2, $3)
      RETURNING id
      `,
      [
        guestName.trim(),
        email.trim(),
        typeof phone === "string"
          ? phone.trim() || null
          : null
      ]
    );

    // Toplam fiyatı hesapla
    const totalPrice =
      Number(room.price_per_night) * nights;

    // Rezervasyonu oluştur
    const booking = await client.query(
      `
      INSERT INTO reservations
        (
          guest_id,
          room_id,
          check_in,
          check_out,
          total_price,
          status
        )
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING id, status
      `,
      [
        guest.rows[0].id,
        room.id,
        checkIn,
        checkOut,
        totalPrice
      ]
    );

    // İşlemi tamamla
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Rezervasyon başarıyla oluşturuldu!",
      reservationId: booking.rows[0].id,
      roomNumber: room.room_number,
      nights,
      totalPrice,
      status: booking.rows[0].status
    });

  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }

    console.error("Reservation error:", error.message);

    res.status(500).json({
      success: false,
      message: "Rezervasyon sırasında hata oluştu."
    });

  } finally {
    if (client) {
      client.release();
    }
  }
});

// 7. Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
