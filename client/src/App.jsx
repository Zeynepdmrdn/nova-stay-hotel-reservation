
import { useState } from "react";
import "./App.css";

const rooms = [
  {
    id: 1,
    name: "Standard Oda",
    description: "Konforlu ve modern bir konaklama deneyimi.",
    price: 1800,
    capacity: 2,
    image:
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900",
  },
  {
    id: 2,
    name: "Deluxe Oda",
    description: "Şık tasarım, geniş yaşam alanı ve lüks detaylar.",
    price: 2900,
    capacity: 3,
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=900",
  },
  {
    id: 3,
    name: "Suite Oda",
    description: "Ayrıcalıklı konfor ve unutulmaz bir otel deneyimi.",
    price: 4500,
    capacity: 4,
    image:
      "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=900",
  },
];

function App() {
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState("");

  const filteredRooms = rooms.filter(
    (room) => room.capacity >= Number(guests)
  );

  function searchRooms(event) {
    event.preventDefault();

    if (!checkIn || !checkOut) {
      setMessage("Lütfen giriş ve çıkış tarihlerini seçiniz.");
      return;
    }

    if (checkOut <= checkIn) {
      setMessage("Çıkış tarihi giriş tarihinden sonra olmalıdır.");
      return;
    }

    setMessage(
      "Kişi sayısına uygun oda tipleri listelendi. " +
      "Tarihe göre gerçek müsaitlik kontrolünü " +
      "veritabanı bağlantısından sonra ekleyeceğiz."
    );

    document.getElementById("rooms")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  return (
    <div className="app">
      <header className="navbar">
        <a href="#" className="logo">
          NOVA<span>STAY</span>
        </a>

        <nav>
          <a href="#home">Ana Sayfa</a>
          <a href="#rooms">Odalarımız</a>
          <a href="#about">Hakkımızda</a>
        </nav>

        <a href="#booking" className="nav-button">
          Rezervasyon Yap
        </a>
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">NOVA STAY HOTEL</p>
          <h1>
            Konforun yeni
            <br />
            adresini keşfedin.
          </h1>
          <p>
            Modern tasarım, eşsiz konfor ve unutulmaz
            bir konaklama deneyimi.
          </p>
          <a href="#rooms" className="hero-button">
            Odaları Keşfet
          </a>
        </div>
      </section>

      <section className="booking-section" id="booking">
        <form className="booking-form" onSubmit={searchRooms}>
          <div className="form-field">
            <label>Giriş Tarihi</label>
            <input
              type="date"
              value={checkIn}
              min={new Date().toLocaleDateString("en-CA")}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Çıkış Tarihi</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || new Date().toLocaleDateString("en-CA")}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Misafir Sayısı</label>
            <select
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            >
              <option value="1">1 Kişi</option>
              <option value="2">2 Kişi</option>
              <option value="3">3 Kişi</option>
              <option value="4">4 Kişi</option>
            </select>
          </div>

          <button type="submit" className="search-button">
            Oda Ara
          </button>
        </form>
        {message && <p className="search-message">{message}</p>}
      </section>

      <section className="rooms-section" id="rooms">
        <p className="section-label">KONAKLAMA</p>
        <h2>Size Özel Odalarımız</h2>
        <p className="section-description">
          İhtiyaçlarınıza uygun odalarımızı keşfedin.
        </p>

        <div className="room-grid">
          {filteredRooms.map((room) => (
            <article className="room-card" key={room.id}>
              <img src={room.image} alt={room.name} />
              <div className="room-info">
                <span className="capacity">
                  {room.capacity} kişiye kadar
                </span>
                <h3>{room.name}</h3>
                <p>{room.description}</p>
                <div className="room-footer">
                  <div>
                    <strong>
                      {room.price.toLocaleString("tr-TR")} TL
                    </strong>
                    <small> / gece</small>
                  </div>
                  <button
                    onClick={() => {
                      setMessage(
                        `${room.name} seçildi. Rezervasyon formunu sonraki aşamada ekleyeceğiz.`
                      );
                      document
                        .getElementById("booking")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    İncele
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer id="about">
        <h2>NOVASTAY</h2>
        <p>Konforun ve huzurun buluşma noktası.</p>
        <small>© 2026 Nova Stay Hotel</small>
      </footer>
    </div>
  );
}

export default App;