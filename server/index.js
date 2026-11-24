
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

// Örnek oda verileri
app.get("/api/rooms", (req, res) => {
  res.json([
    { id: 1, name: "Standard Oda", price: 1800 },
    { id: 2, name: "Deluxe Oda", price: 2900 },
    { id: 3, name: "Suite Oda", price: 4500 }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
