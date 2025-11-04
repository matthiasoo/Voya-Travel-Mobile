# 🌍 Voya

Aplikacja mobilna do wyszukiwania, rezerwacji i oceniania noclegów oraz atrakcji turystycznych.  
Projekt realizowany w technologii **React Native (Expo)** z integracją **Firebase**.

---

## 🚀 Tech Stack

### 📱 Frontend
- **React Native (Expo)**
- **TypeScript**
- **Expo Router** – nawigacja
- **NativeWind** – stylizacja UI

### ☁️ Backend
- **Node.js + Express** – REST API i logika aplikacji
- **Firebase** – uwierzytelnianie i przechowywanie danych (Auth, Firestore, Storage)

---

## 🧩 Podstawowe funkcjonalności

### 👤 Typy kont
- 3 typy użytkowników:
    - **Użytkownik** - turysta
    - **Dostawca usług** – właściciel hotelu, organizator wycieczek
    - **Administrator** – głównie moderator

### 🏕️ Oferty i rezerwacje
- Dodawanie ofert przez dostawców:
    - tytuł, opis, cena, zdjęcia, lokalizacja, dostępne terminy, udogodnienia
- Kategorie: **noclegi**, **wycieczki**, **atrakcje**, **przewodnicy**
- Wyszukiwanie i filtrowanie:
    - po lokalizacji, dacie, cenie, typie, ocenach, dostępności
- System rezerwacji z **dwustronnym potwierdzeniem** (użytkownik + dostawca)
- Historia rezerwacji i statusy (oczekująca, potwierdzona, anulowana)
- System ocen i opinii po zakończonej usłudze

### 💬 Komunikacja
- Czat pomiędzy użytkownikiem a dostawcą
- Powiadomienia o:
    - zmianach statusu rezerwacji
    - nowych wiadomościach
    - potwierdzeniach i anulowaniach

---

## ♿ Dostępność i bezpieczeństwo

- Duże czcionki i wysoki kontrast
- Kompatybilność z technologiami asystującymi
- Wyszukiwanie głosem (voice input)
- Maskowanie danych kontaktowych do momentu rezerwacji
- System zgłaszania nieuczciwych ofert i użytkowników - przez bazę danych
- Weryfikacja dostawców - przez bazę danych

---

## 🤖 Integracje LLM

- Generowanie opisów ofert na podstawie słów kluczowych
- Automatyczne tłumaczenia ofert i komunikatów

---

## 🗺️ Inne funkcje

- Mapa ofert (biblioteka mapowa)
- Powiadomienia push i e-mail
- System moderacji treści (view w sql)
- Panel administracyjny (moderacja i statystyki)

---

## ⚙️ Funkcjonalności techniczne

1. **Logowanie i uwierzytelnianie** – Firebase Auth (email / Google)
2. **System transakcyjny** – tworzenie i zarządzanie ofertami, rezerwacje z dwustronnym potwierdzeniem
3. **Funkcje dostępności** – wprowadzanie głosowe, wysoki kontrast, wsparcie asystentów
4. **Prywatność** – maskowanie danych kontaktowych do momentu rezerwacji
5. **Dwustronne potwierdzenie** – zarówno użytkownik, jak i dostawca potwierdzają rezerwację
6. **System weryfikacji** – weryfikacja dostawców
7. **Przechowywanie plików BLOB** – zdjęcia ofert, profili i wiadomości
8. **Integracja z LLM** – generowanie opisów, tłumaczenia, sugestie
9. **Pozostałe** – mapa, powiadomienia, panel admina, moderacja treści

---