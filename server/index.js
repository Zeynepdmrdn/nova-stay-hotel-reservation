
const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Backend kontrolü
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "NOVA STAY Backend calisiyor!"
  });
});

// Oda fotoğrafları
const roomImages = {
  "Standard Oda":
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900",
  "Deluxe Oda":
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900",
  "Suite Oda":
    "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900"
};

// Odaları PostgreSQL'den getir
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
      JOIN rooms r
        ON r.room_type_id = rt.id
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

// PostgreSQL bağlantı kontrolü
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

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
