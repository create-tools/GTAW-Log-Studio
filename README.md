# GTAW Log Studio

<p align="center">
  <img src="public/icon.png" alt="GTAW Log Studio Logo" width="110" height="110" style="border-radius: 24px;" />
</p>

<p align="center">
  <img src="public/logo_text.png" alt="GTAW | LOG STUDIO" width="360" />
</p>

<p align="center">
  <strong>Native FiveM Chatlog Engine, Auto-Backup System, Multi-POV Merger & Roleplay Screenshot Studio</strong>
</p>

<p align="center">
  <em>Developed by <strong>Altay</strong> for the text-roleplay community.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-blue" alt="Platform" />
  <img src="https://img.shields.io/badge/Electron-34.x-47848F" alt="Electron" />
  <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6" alt="TypeScript" />
  <img src="https://img.shields.io/badge/IndexedDB-Dexie.js-orange" alt="IndexedDB" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## Overview

**GTAW Log Studio** is an open-source desktop application built specifically for GTA World players. It connects directly to the FiveM client process to capture in-game chatlogs in real time, organizes them into searchable sessions, and provides a built-in studio for generating roleplay screenshots (SS) with transparent Photoshop export.

---

## Application Previews

### 1. Main Chatlog Engine & Clean Roleplay Viewer
Real-time log stream categorized into official color channels (IC, /me, /do, Radio, Phone, PM). Features speaker filtering, regex search, and Clean RP mode.

<p align="center">
  <img src="docs/screenshots/main_viewer.png" alt="Main Chatlog Viewer" width="850" />
</p>

---

### 2. Roleplay Screenshot & Chatbox Studio (SS Maker)
Interactive canvas for arranging dialogue on top of in-game screenshots. Supports transparent PNG clipboard export (`Ctrl+V` into Photoshop), custom stroke/shadow presets, and automatic scene splitting based on time gaps.

<p align="center">
  <img src="docs/screenshots/ss_studio.png" alt="Roleplay Screenshot Studio" width="850" />
</p>

---

### 3. Radio, Department & Dispatch Console
Dedicated operations console for Law Enforcement, Fire/EMS, and Government factions. Parses callsigns, 10-codes, and cross-department brackets.

<p align="center">
  <img src="docs/screenshots/radio_dispatch.png" alt="Radio and Dispatch Console" width="850" />
</p>

---

### 4. Multi-POV Chronological Log Merger
Combine logs from multiple roleplay participants. Interleaves lines chronologically by timestamp while automatically removing duplicate messages.

<p align="center">
  <img src="docs/screenshots/log_merger.png" alt="Log Merger" width="850" />
</p>

---

## Key Features

- **Live Memory Engine**: Automatically detects active FiveM processes and reads live chat streams with zero game performance impact.
- **Smart Black Background Remover**: Mathematical keying algorithm removes solid black backgrounds with no outline artifacts.
- **Direct Photoshop Integration**: Copy transparent rendered text directly to clipboard for instant pasting into image editing software.
- **AFK Notification Chimes**: Audio alerts trigger only when you are mentioned or receive a private message while alt-tabbed.
- **Multi-Format Export**: Export parsed logs to GTA World Forum BBCode (`[color=...]`), plain text, or JSON backup.
- **In-App Feedback**: Submit bug reports and feature requests directly to GitHub Issues from within the application.

---

## Multi-Language Support (i18n)

The interface is fully localized across five languages:

| Flag | Language | Scope |
| :---: | :---: | :---: |
| 🇺🇸 | English | Standard GTA World global roleplay terminology |
| 🇹🇷 | Türkçe | GTA World Türkiye & Turkish community |
| 🇷🇺 | Русский | GTA World Russian community |
| 🇫🇷 | Français | GTA World France |
| 🇪🇸 | Español | GTA World Spain & Hispanic community |

---

## Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Ctrl + F` | Focus search filter input |
| `Ctrl + S` | Open Screenshot Studio |
| `Ctrl + Shift + F` | Toggle Clean RP Mode |
| `Ctrl + Shift + C` | Copy selected log lines to clipboard |
| `Shift + Click` | Select range of log lines |
| `Esc` | Close active modal or clear search filter |
| `?` | Open keyboard shortcuts help modal |

---

## Installation & Development

### Requirements
- Node.js (v18 or higher)
- npm or yarn
- Windows 10/11 (x64)

### Development Setup
```bash
# 1. Clone repository
git clone https://github.com/create-tools/GTAW-Log-Studio.git
cd GTAW-Log-Studio

# 2. Install dependencies
npm install

# 3. Start in development mode (Vite + Electron)
npm run dev
```

### Production Build
```bash
# Build installer and portable executables
npm run dist

# Build only portable executable
npm run dist:portable
```
The build output will be placed in the `release/` folder.

---

## Disclaimer

**Community Project Notice**:  
GTAW Log Studio is an independent open-source tool developed by **Altay**. It is not affiliated with, endorsed by, or an official product of GTA World, Rockstar Games, or FiveM / Cfx.re.

---

## License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.  
Copyright (c) 2026 **Altay**.
