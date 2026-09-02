# 🎮 GTAW Log Studio

<p align="center">
  <img src="public/icon.png" alt="GTAW Log Studio Logo" width="128" height="128" style="border-radius: 28px;" />
</p>

<p align="center">
  <img src="public/logo_text.png" alt="GTAW | LOG STUDIO" width="380" />
</p>

<p align="center">
  <strong>Native FiveM Chatlog Engine, Auto-Backup System, Multi-POV Merger & Photoshop-Compatible Roleplay SS Studio</strong>
</p>

<p align="center">
  <em>Developed by <strong>Altay</strong> for the GTA World and Text-Roleplay Community.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%20(x64)-blue.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Electron-34.x-47848F.svg" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19-61DAFB.svg" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Dexie.js-IndexedDB-orange.svg" alt="IndexedDB" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/i18n-EN%20%7C%20TR%20%7C%20RU%20%7C%20FR%20%7C%20ES-purple.svg" alt="Languages" />
</p>

---

## 🌐 Multi-Language Support / Çoklu Dil Desteği

GTAW Log Studio comes with full internationalization out of the box for global GTA World communities:

| Flag | Language | Scope & Terminology |
| :---: | :---: | :---: |
| 🇺🇸 | **English** | Standard GTA World Global Roleplay Terms |
| 🇹🇷 | **Türkçe** | GTA World Türkiye & Global Türkçe |
| 🇷🇺 | **Русский** | GTA World Русский |
| 🇫🇷 | **Français** | GTA World France |
| 🇪🇸 | **Español** | GTA World España |

---

## ✨ Features / Özellikler

### 1. ⚡ Live FiveM Native Memory & Chatlog Capture
- Automatically discovers and monitors active FiveM processes without needing manual file uploads.
- Real-time stream parsing for IC, /me, /do, PM, Radio, SMS, and Department channels with official GTAW color codes.
- Zero lag, minimal RAM & CPU footprint (runs seamlessly in the Windows tray).

### 2. 🔀 Multi-POV Chronological Log Merger
- Combine chatlogs from your roleplay partners and other players at the scene.
- Interleaves all lines chronologically by timestamp while automatically eliminating duplicate messages.

### 3. 📸 Roleplay Screenshot & Chatbox Studio (SS Maker)
- **Direct Photoshop Transparent PNG Copy:** One-click copy into Photoshop (`Ctrl+V`) with flawless transparency.
- **Smart Black Background Remover:** Automatically removes solid black backgrounds with zero halo artifacts.
- **Storyline Scene Splitter:** Intelligently splits scenes based on time gaps (e.g. 3-minute pauses).
- **Customizable Styling:** GTAW default, SAMP/GTA classic, and cinematic HD presets with outline and drop shadows.

### 4. 📻 Radio, Department & Dispatch Console
- Dedicated console for Law Enforcement, Fire/EMS, and Government agencies.
- Parses 10-Codes (`10-4`, `10-99`, `10-20`), callsigns, and department radio brackets (`[LSGOV -> LSSD]`).
- One-click transfer of radio logs to SS Studio.

### 5. 📱 Phone & SMS Conversation View
- Organizes private messages and SMS into clean, modern contact chat bubbles.
- Filter and copy conversations with specific characters.

### 6. 🔔 Smart AFK Chimes & Sound Alerts (Alt-Tab Aware)
- Stays quiet while you are in-game; chimes when someone mentions your character name or sends you a `/pm` while you are Alt-Tabbed.
- Emergency panic alarms for `10-99`, `PANIC`, and custom keywords.

### 7. 📤 Quick Forum BBCode & Multi-format Export
- One-click export to GTA World Forum BBCode (`[color=...]`), clean plain text, or backup JSON.

### 8. 💬 In-App GitHub Feedback & Issue Tracker
- Submit bug reports 🐞, feature requests 💡, or general feedback 💬 directly from within the app to GitHub Issues.

---

## ⌨️ Keyboard Shortcuts / Klavye Kısayolları

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + F` | Focus Search Input |
| `Ctrl + S` | Open SS Studio |
| `Ctrl + Shift + F` | Toggle Clean Roleplay Mode |
| `Ctrl + Shift + C` | Copy selected lines to clipboard |
| `Shift + Click` | Multi-select range between two log lines |
| `Esc` | Close open modal or clear search |
| `?` | Open Keyboard Shortcuts Guide |

---

## 🚀 Installation & Building from Source

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn

### Development Mode
```bash
# 1. Clone the repository
git clone https://github.com/create-tools/GTAW-Log-Studio.git
cd GTAW-Log-Studio

# 2. Install dependencies
npm install

# 3. Start development environment (Vite + Electron)
npm run dev
```

### Production Build (Windows Installer & Portable)
```bash
# Build NSIS Setup and Portable .exe
npm run dist

# Build only Portable standalone executable
npm run dist:portable
```
Output files will be generated in the `release/` directory.

---

## ⚖️ Disclaimer / Sorumluluk Reddi

> [!IMPORTANT]
> **Community Project Disclaimer:**  
> GTAW Log Studio is an independent, open-source community tool developed by **Altay**. It is **not** an official product of GTA World, Rockstar Games, or FiveM/Cfx.re. All trademarks and registered trademarks are the property of their respective owners.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.  
Copyright (c) 2026 **Altay**.
