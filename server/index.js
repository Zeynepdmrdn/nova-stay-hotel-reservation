
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API kontrolü
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "NOVA STAY Backend calisiyor!"
  });
});


app.get("/api/rooms", (req, res) => {
  const rooms = [
    {
      id: 1,
      name: "Standard Oda",
      price: 1800,
      capacity: 2,
      description: "Konforlu ve modern bir konaklama deneyimi.",
      image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900"
    },
    {
      id: 2,
      name: "Deluxe Oda",
      price: 2900,
      capacity: 3,
      description: "Şık tasarım, geniş yaşam alanı ve lüks detaylar.",
      image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900"
    },
    {
      id: 3,
      name: "Suite Oda",
      price: 4500,
      capacity: 4,
      description: "Ayrıcalıklı konfor ve unutulmaz bir otel deneyimi.",
      image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900"
    }
  ];

  res.json(rooms);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
