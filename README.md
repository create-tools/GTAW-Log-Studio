<p align="center">
  <img src="public/icon.png" alt="GTAW Log Studio Logo" width="128" height="128" style="border-radius: 28px;" />
</p>

<p align="center">
  <img src="public/logo_text.png" alt="GTAW LOG STUDIO" width="400" />
</p>

<p align="center">
  <strong>High-Performance FiveM Chatlog Engine, Auto-Backup System, Multi-POV Merger & Roleplay Screenshot Studio</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Release-v1.0.0-purple?style=flat-square" alt="Release" />
  <img src="https://img.shields.io/badge/Platform-Windows%20x64-blue?style=flat-square" alt="Platform" />
  <img src="https://img.shields.io/badge/FiveM-Native%20Engine-black?style=flat-square" alt="FiveM" />
  <img src="https://img.shields.io/badge/i18n-5%20Languages-emerald?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
</p>

---

## Overview

**GTAW Log Studio** is an open-source suite designed for GTA World text-roleplay players, faction members, screenshot storytellers, and law enforcement agencies. It hooks directly into the FiveM client process to parse, colorize, and archive in-game dialogue in real time without causing any frame drops.

---

## Screenshots & Modules

### 1. Live Chatlog Viewer & Clean Roleplay Engine
Direct process hooking and live parsing of IC, /me, /do, PM, Radio, SMS, and Department channels.

<p align="center">
  <img src="docs/screenshots/main_viewer.png" alt="Main Chatlog Viewer" width="900" style="border-radius: 10px;" />
</p>

---

### 2. Roleplay Screenshot Studio (SS Maker)
Interactive canvas with customizable typography, stroke outlines, drop shadows, storyline scene splitting, and one-click transparent PNG clipboard export into image editing software like Photoshop.

<p align="center">
  <img src="docs/screenshots/ss_studio.png" alt="Roleplay SS Studio" width="900" style="border-radius: 10px;" />
</p>

---

### 3. Smart Black Background Remover (Keyer)
Extracts clean, transparent dialogue text from solid black /blind in-game chatbox screenshots with zero color halo or anti-aliasing artifacts.

<p align="center">
  <img src="docs/screenshots/ss_studio_keyer.png" alt="Black Screen Keyer" width="900" style="border-radius: 10px;" />
</p>

---

### 4. Emergency & Radio Dispatch Console
Dedicated terminal parsing 10-Codes, unit callsigns, emergency alerts, and faction radio brackets for Law Enforcement and Medical Services.

<p align="center">
  <img src="docs/screenshots/radio_dispatch.png" alt="Radio and Dispatch Console" width="900" style="border-radius: 10px;" />
</p>

---

### 5. Multi-POV Log Merger
Chronologically interleaves chatlogs from multiple players present at a scene, automatically eliminating duplicate lines.

<p align="center">
  <img src="docs/screenshots/log_merger.png" alt="Multi-POV Log Merger" width="900" style="border-radius: 10px;" />
</p>

---

## Key Features

- **Live Memory Engine**: Automatic FiveM process hook with zero polling overhead.
- **Storyline Scene Splitter**: Divides long logs into sequential scene cards based on customizable silence gaps (2m, 3m, 5m).
- **Multi-POV Log Merger**: Combines logs from multiple character perspectives into a unified chronological storyline.
- **Alt-Tab Aware Notifications**: Smart audio chimes sound only when mentioned or PMed while the game is unfocused.
- **Multi-Format Export**: Forum-ready BBCode ([color=...]), clean plain text, or backup JSON.
- **Internationalization (i18n)**: Fully translated into 5 languages (English, Turkish, Russian, French, Spanish).
- **In-App Issue Reporter**: Integrated bug reporting directly connected to GitHub Issues.

---

## Supported Languages

| Code | Language | Native Name |
| :---: | :---: | :---: |
| EN | English | English |
| TR | Turkish | Türkçe |
| RU | Russian | Русский |
| FR | French | Français |
| ES | Spanish | Español |

---

## Installation & Downloads

Executable builds are provided on the [GitHub Releases](https://github.com/create-tools/GTAW-Log-Studio/releases) page:

| Package | Filename | Description |
| :--- | :--- | :--- |
| **Windows Installer** | `GTAW Log Studio Setup 1.0.0.exe` | Standard Windows installer with shortcuts. |
| **Portable Standalone** | `GTAW Log Studio 1.0.0.exe` | Standalone binary requiring no installation. |

---

## Development & Build Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/create-tools/GTAW-Log-Studio.git
cd GTAW-Log-Studio

# Install dependencies
npm install

# Run development mode
npm start

# Build production binaries (Setup & Portable)
npm run dist
```

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

*Disclaimer: GTAW Log Studio is an independent community tool developed by Altay and is not affiliated with Rockstar Games, GTA World, or FiveM / Cfx.re.*
