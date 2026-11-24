
import { useEffect, useState } from "react";
import "./App.css";

function App() {
  // Backend'den gelecek oda verileri
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Rezervasyon arama bilgileri
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState("");

  // Express API'den oda bilgilerini getir
  useEffect(() => {
    const controller = new AbortController();

    async function fetchRooms() {
      try {
        const response = await fetch(
          "http://localhost:3001/api/rooms",
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Oda verileri alınamadı.");
        }

        const data = await response.json();
        setRooms(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError("Sunucu bağlantısı kurulamadı.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchRooms();

    return () => controller.abort();
  }, []);

  // Kişi sayısına göre oda filtreleme
  const filteredRooms = rooms.filter(
    (room) => room.capacity >= Number(guests)
  );

  // Oda arama işlemi
  function searchRooms(event) {
    event.preventDefault();

    if (!checkIn || !checkOut) {
      setMessage("Lütfen giriş ve çıkış tarihlerini seçiniz.");
      return;
    }

    if (checkOut <= checkIn) {
      setMessage(
        "Çıkış tarihi giriş tarihinden sonra olmalıdır."
      );
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
      {/* Üst menü */}
      <header className="navbar">
        <a href="#home" className="logo">
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

      {/* Ana sayfa */}
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

      {/* Rezervasyon arama alanı */}
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
              min={
                checkIn ||
                new Date().toLocaleDateString("en-CA")
              }
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label>Misafir Sayısı</label>
            <select
              value={guests}
              onChange={(e) =>
                setGuests(Number(e.target.value))
              }
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

        {message && (
          <p className="search-message">{message}</p>
        )}
      </section>

      {/* Odalar */}
      <section className="rooms-section" id="rooms">
        <p className="section-label">KONAKLAMA</p>

        <h2>Size Özel Odalarımız</h2>

        <p className="section-description">
          İhtiyaçlarınıza uygun odalarımızı keşfedin.
        </p>

        {/* API yüklenme ve hata kontrolü */}
        {loading && <p>Odalar yükleniyor...</p>}

        {error && (
          <p role="alert" className="search-message">
            {error}
          </p>
        )}

        {!loading &&
          !error &&
          filteredRooms.length === 0 && (
            <p>
              Seçilen kişi sayısına uygun oda bulunamadı.
            </p>
          )}

        {/* Backend'den gelen odalar */}
        {!loading && !error && (
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
                      type="button"
                      onClick={() => {
                        setMessage(
                          `${room.name} seçildi. ` +
                          "Rezervasyon formunu sonraki " +
                          "aşamada ekleyeceğiz."
                        );

                        document
                          .getElementById("booking")
                          ?.scrollIntoView({
                            behavior: "smooth",
                          });
                      }}
                    >
                      İncele
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Alt alan */}
      <footer id="about">
        <h2>NOVASTAY</h2>
        <p>Konforun ve huzurun buluşma noktası.</p>
        <small>© 2026 Nova Stay Hotel</small>
      </footer>
    </div>
  );
}

export default App;
