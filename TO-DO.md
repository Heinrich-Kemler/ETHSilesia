# ⛏️ Skarbnik DeFi - Projekt Hakatonowy

## ✅ Status Projektu: CO JUŻ MAMY

- [x] **Skarbnik AI (Mózg):** Chatbot Grok-4 zintegrowany z bazą wiedzy (RAG) i pamięcią użytkownika.
- [x] **SkarbnikGuard (Monitoring):** Backend automatycznie pobierający alerty z CERT/KNF/Niebezpiecznika.
- [x] **Feed Bezpieczeństwa:** Działająca podstrona z listą aktualnych zagrożeń.
- [x] **Newsletter:** Infrastruktura Resend podpięta pod bazę alertów (wysyłka działa).
- [x] **Baza Danych:** Supabase (tabele: `users`, `scam_alerts`, `chat_history`).

---

## 🚀 DO ZROBIENIA (Priorytety na finał)

### 1. System Gamifikacji (Kluczowy "Killer Feature")

- [ ] **Moduł Quizów:** Stworzenie komponentu quizu po każdym rozdziale wiedzy.
- [ ] **System Poziomów (Leveling):** Logika w bazie danych, która promuje użytkownika (Level 1 -> 2 -> 3) po rozwiązaniu quizów.
- [ ] **Galeria Odznak NFT:** Podstrona w profilu użytkownika pokazująca zdobyte odznaki (użyj wygenerowanych grafik górnika).
- [ ] **Integracja z Privy:** Wyświetlanie adresu portfela użytkownika i przypisanie do niego "wirtualnych" NFT (na demo wystarczy symulacja on-chain).

### 2. Design & UI Polish

- [ ] **Landing Page v2:** Implementacja nowego, spójnego designu (użyj motywu kopalni/skarbnika, który wypracowaliśmy).
- [ ] **E-mail Templates:** Poprawa wyglądu maili w Resend (dodanie logo, kolorów PKO i analogii od Skarbnika).
- [ ] **Strona Główna Aplikacji (Dashboard):** Widok po zalogowaniu: "Witaj Górniku! Twój poziom: X. Dzisiejsze alerty: Y".

### 3. Skarbnik AI - Ostatnie Szlify

- [ ] **Wstrzykiwanie Alertów:** Dodanie logiki, by chatbot w pierwszej wiadomości wspomniał o najnowszym krytycznym alercie z bazy.
- [ ] **Analogie Live:** Upewnienie się, że prompt systemowy wymusza na Groku używanie analogii górniczych/bankowych w każdej odpowiedzi.

### 4. Przygotowanie do Prezentacji (Pitch Deck)

- [ ] **Nagranie Demo (Screen Recording):** Na wypadek, gdyby internet na miejscu padł.
- [ ] **Slajdy z "Analogią":** Przygotowanie slajdu porównującego techniczny bełkot vs. tłumaczenie Skarbnika (to zachwyci jurorów).
- [ ] **High-Level Concept:** Przygotowanie 30-sekundowego "Elevator Pitch".

---

## 🛠️ Notatki Techniczne

- **Assety:** Grafiki odznak NFT (1:1) oraz tło kopalni są gotowe do wklejenia.
- **API:** Sprawdzić limity na kluczu Groka przed finałem.
- **Vercel:** Upewnić się, że zmienne środowiskowe (`.env`) są poprawnie skonfigurowane na produkcji.
