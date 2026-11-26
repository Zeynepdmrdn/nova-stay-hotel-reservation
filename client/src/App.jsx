import { useEffect, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:3001";

function App() {
  // Oda verileri
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableRooms, setAvailableRooms] = useState(null);
  const [searching, setSearching] = useState(false);
  const searchVersion = useRef(0);
  // Rezervasyon arama bilgileri
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState("");

  // Seçilen oda
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Misafir bilgileri
  const [guestName, setGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Rezervasyon durumları
  const [submitting, setSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);

  const todayDate = new Date();
  const today = [
    todayDate.getFullYear(),
    String(todayDate.getMonth() + 1).padStart(2, "0"),
    String(todayDate.getDate()).padStart(2, "0")
  ].join("-");

  // PostgreSQL verilerini Express API üzerinden al
  useEffect(() => {
    const controller = new AbortController();

    async function fetchRooms() {
      try {
        const response = await fetch(
          `${API_URL}/api/rooms`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Odalar alınamadı.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Geçersiz oda verisi.");
        }

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

  // Oda seçildiğinde rezervasyon formuna git
  useEffect(() => {
    if (selectedRoom) {
      document.getElementById("reservation-form")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
    }
  }, [selectedRoom]);

  // Kişi kapasitesine ve arama sonucuna göre odaları göster
  const filteredRooms = (availableRooms ?? rooms).filter(
    (room) => room.capacity >= Number(guests)
  );

  // Arama kriteri değişirse önceki müsaitlik sonuçlarını geçersiz kıl
  function resetAvailability() {
    searchVersion.current += 1;
    setSearching(false);
    setAvailableRooms(null);
    setSelectedRoom(null);
    setBookingStatus(null);
    setMessage("");
  }

  // PostgreSQL'den tarihe göre gerçekten müsait odaları sorgula
  async function searchRooms(event) {
    event.preventDefault();

    if (!checkIn || !checkOut) {
      setMessage("Lütfen giriş ve çıkış tarihlerini seçiniz.");
      return;
    }

    if (checkIn < today || checkOut <= checkIn) {
      setMessage("Lütfen geçerli tarihler seçiniz.");
      return;
    }

    const currentSearch = ++searchVersion.current;
    setSearching(true);
    setMessage("");
    setAvailableRooms(null);
    setSelectedRoom(null);
    setBookingStatus(null);

    try {
      const params = new URLSearchParams({
        checkIn,
        checkOut,
        guests: String(guests)
      });

      const response = await fetch(`${API_URL}/api/availability?${params}`);
      const data = await response.json();
      if (currentSearch !== searchVersion.current) return;

      if (!response.ok) {
        throw new Error(data.message || "Müsaitlik kontrolü başarısız.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Geçersiz API yanıtı.");
      }

      setAvailableRooms(data);
      setMessage(
        data.length === 0
          ? "Seçtiğiniz tarihlerde uygun oda bulunamadı."
          : `${data.length} müsait oda tipi bulundu!`
      );

      document.getElementById("rooms")?.scrollIntoView({
        behavior: "smooth"
      });
    } catch (err) {
      if (currentSearch === searchVersion.current) {
        setAvailableRooms(null);
        setMessage(err.message || "Müsaitlik sorgusu başarısız oldu.");
      }
    } finally {
      if (currentSearch === searchVersion.current) {
        setSearching(false);
      }
    }
  }

  // Oda seçimi
  function selectRoom(room) {
    if (availableRooms === null || searching) return;
    setSelectedRoom(room);
    setBookingStatus(null);
    setMessage("");
  }

  // Rezervasyonu backend'e gönder
  async function createReservation(event) {
    event.preventDefault();

    if (!selectedRoom || availableRooms === null) return;

    if (
      !checkIn ||
      !checkOut ||
      checkIn < today ||
      checkOut <= checkIn
    ) {
      setBookingStatus({
        type: "error",
        message: "Lütfen geçerli konaklama tarihleri seçiniz."
      });
      return;
    }

    if (Number(guests) > selectedRoom.capacity) {
      setBookingStatus({
        type: "error",
        message: "Seçilen oda kişi sayısına uygun değil."
      });
      return;
    }

    setSubmitting(true);
    setBookingStatus(null);

    try {
      const response = await fetch(
        `${API_URL}/api/reservations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            guestName: guestName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            roomTypeId: selectedRoom.id,
            checkIn,
            checkOut
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Rezervasyon oluşturulamadı."
        );
      }

      setBookingStatus({
        type: "success",
        message:
          `Rezervasyon #${data.reservationId} oluşturuldu! ` +
          `Oda: ${data.roomNumber} | ` +
          `Toplam: ${Number(data.totalPrice).toLocaleString("tr-TR")} TL. ` +
          "Rezervasyonunuz onay bekliyor."
      });

      setGuestName("");
      setEmail("");
      setPhone("");
      // Yeni rezervasyon için tarih müsaitliği tekrar kontrol edilmeli.
      setAvailableRooms(null);

    } catch (err) {
      setBookingStatus({
        type: "error",
        message: err.message
      });
    } finally {
      setSubmitting(false);
    }
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

      {/* Tarih ve kişi seçimi */}
      <section className="booking-section" id="booking">
        <form className="booking-form" onSubmit={searchRooms}>

          <div className="form-field">
            <label htmlFor="check-in">Giriş Tarihi</label>
            <input
              id="check-in"
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => {
                const nextDate = e.target.value;
                setCheckIn(nextDate);
                if (checkOut && checkOut <= nextDate) setCheckOut("");
                resetAvailability();
              }}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="check-out">Çıkış Tarihi</label>
            <input
              id="check-out"
              type="date"
              value={checkOut}
              min={checkIn || today}
              onChange={(e) => {
                setCheckOut(e.target.value);
                resetAvailability();
              }}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="guest-count">Misafir Sayısı</label>
            <select
              id="guest-count"
              value={guests}
              onChange={(e) => {
                setGuests(Number(e.target.value));
                resetAvailability();
              }}
            >
              <option value="1">1 Kişi</option>
              <option value="2">2 Kişi</option>
              <option value="3">3 Kişi</option>
              <option value="4">4 Kişi</option>
            </select>
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={searching}
          >
            {searching ? "Odalar Kontrol Ediliyor..." : "Oda Ara"}
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

        {loading && <p>Odalar yükleniyor...</p>}

        {error && (
          <p role="alert" className="search-message">
            {error}
          </p>
        )}

        {!loading && !error &&
          filteredRooms.length === 0 && (
            <p>Bu kriterlere uygun oda tipi bulunamadı.</p>
          )}

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
                      disabled={availableRooms === null || searching}
                      onClick={() => selectRoom(room)}
                    >
                      {availableRooms === null ? "Önce Oda Ara" : "Rezervasyon Yap"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Gerçek rezervasyon formu */}
      {selectedRoom && (
        <section
          className="reservation-section"
          id="reservation-form"
        >
          <div className="reservation-panel">

            <p className="section-label">
              REZERVASYON
            </p>

            <h2>Rezervasyonunuzu Tamamlayın</h2>

            <p className="selected-room-text">
              Seçilen oda: <strong>{selectedRoom.name}</strong>
            </p>

            <p className="reservation-dates">
              {checkIn && checkOut
                ? `${checkIn} — ${checkOut}`
                : "Lütfen üst bölümden tarih seçiniz."}
            </p>

            <form
              className="reservation-fields"
              onSubmit={createReservation}
            >
              <div className="form-field">
                <label htmlFor="full-name">Ad Soyad</label>
                <input
                  id="full-name"
                  type="text"
                  placeholder="Adınız ve soyadınız"
                  value={guestName}
                  onChange={(e) =>
                    setGuestName(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="email">E-posta</label>
                <input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="phone">Telefon</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="05XX XXX XX XX"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                />
              </div>

              <button
                type="submit"
                className="search-button reservation-submit"
                disabled={submitting || bookingStatus?.type === "success"}
              >
                {submitting
                  ? "Rezervasyon Oluşturuluyor..."
                  : "Rezervasyonu Tamamla"}
              </button>
            </form>

            {bookingStatus && (
              <p
                role="status"
                className={
                  bookingStatus.type === "success"
                    ? "booking-success"
                    : "booking-error"
                }
              >
                {bookingStatus.message}
              </p>
            )}

          </div>
        </section>
      )}

      {/* Footer */}
      <footer id="about">
        <h2>NOVASTAY</h2>
        <p>Konforun ve huzurun buluşma noktası.</p>
        <small>© 2026 Nova Stay Hotel</small>
      </footer>

    </div>
  );
}

export default App;
