# 🌍 Voya

Aplikacja mobilna do wyszukiwania, rezerwacji i oceniania noclegów oraz atrakcji turystycznych.  
Projekt realizowany w technologii **React Native (Expo)** z architekturą **Serverless** opartą na **Firebase**.

---

## 🚀 Tech Stack

### 📱 Frontend
- **React Native (Expo)**
- **TypeScript**
- **Expo Router** – nawigacja oparta na plikach
- **NativeWind** (TailwindCSS) – stylizacja UI

### ☁️ Backend (Serverless)
- **Firebase Authentication** – logowanie i rejestracja
- **Cloud Firestore** – baza danych NoSQL
- **Firebase Storage** – przechowywanie zdjęć
- **Brak własnego serwera backendowego** – logika biznesowa po stronie klienta i usług Firebase.

---

## 🧩 Podstawowe funkcjonalności

### 👤 Typy kont
- 3 typy użytkowników:
    - **Użytkownik** - turysta
    - **Dostawca usług** – właściciel hotelu, organizator wycieczek
    - **Administrator** – podgląd i moderacja

### 🏕️ Oferty i rezerwacje
- Dodawanie ofert przez dostawców:
    - tytuł, opis, cena, zdjęcia, lokalizacja, szczegóły (udogodnienia, plan wycieczki)
- Kategorie: **noclegi**, **wycieczki** (przewodnicy i atrakcje mogą być dodawane jako wycieczki/oferty)
- Wyszukiwanie i filtrowanie:
    - po lokalizacji i typie
- System rezerwacji:
    - tworzenie zapytań rezerwacyjnych
    - czat w kontekście oferty

### 💬 Komunikacja
- Czat czasie rzeczywistym (Firestore) pomiędzy użytkownikiem a dostawcą
- Powiadomienia wewnątrz aplikacji (lista czatów)

---

## ♿ Dostępność i bezpieczeństwo

- **Dostępność**: Przystosowanie pod czytniki ekranowe, wysoki kontrast, duże elementy interaktywne.
- **Bezpieczeństwo treści**:
    - **AI Safety Check**: Automatyczna weryfikacja treści wprowadzanych przez użytkowników przy użyciu modelu Llama-3 (przez Groq API). Wykrywa mowę nienawiści, przemoc itp.

---

## 🤖 Integracje AI (LLM)

Projekt wykorzystuje API **Groq** z modelem **Llama-3-70b-versatile**:

- **Generowanie opisów**: Automatyczne tworzenie atrakcyjnych opisów ofert na podstawie tytułu, lokalizacji i udogodnień.
- **Moderacja treści**: Sprawdzanie wpisów użytkownika pod kątem bezpieczeństwa (Safety Check).

---

## 🗺️ Inne funkcje

- Mapy (React Native Maps / Expo Location)
- Seeder danych (wypełnianie bazy przykładowymi ofertami i opiniami)

---

## ⚙️ Konfiguracja projektu

### Wymagane zmienne środowiskowe (.env)
Aby uruchomić projekt, utwórz plik `.env` i dodaj:
```
EXPO_PUBLIC_GROQ_API_KEY=twoj_klucz
GOOGLE_MAPS_API_KEY=twoj_klucz
```
Oraz skonfiguruj plik `google-services.json` dla Firebase.

### Uruchamianie
```bash
npm install
# Uruchomienie na emulatorze/urządzeniu Android
# (To polecenie automatycznie zbuduje aplikację w trybie deweloperskim)
npx expo run:android
```