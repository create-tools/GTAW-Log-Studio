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

<p align="center">
  <a href="#overview">English</a> •
  <a href="#türkçe-tanıtım">Türkçe</a> •
  <a href="#русский-обзор">Русский</a> •
  <a href="#présentation-en-français">Français</a> •
  <a href="#descripción-en-español">Español</a>
</p>

---

## Overview

**GTAW Log Studio** is an open-source desktop suite designed for GTA World players. It hooks directly into the FiveM client process to parse, colorize, and archive in-game dialogue in real time without causing any frame drops.

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

## Installation & Downloads

Download the latest official release from the [GitHub Releases](https://github.com/create-tools/GTAW-Log-Studio/releases) page:

- **Installer:** `GTAW Log Studio Setup 1.0.0.exe` (Standard Windows NSIS Setup)
- **Portable:** `GTAW Log Studio 1.0.0.exe` (Standalone single executable, no installation required)

---

## Other Languages

<details>
<summary><b id="türkçe-tanıtım">Türkçe Tanıtım (Turkish)</b></summary>

### Genel Bakış
GTAW Log Studio, FiveM sürecine doğrudan bağlanarak oyun içi sohbet satırlarını sıfır performans kaybıyla anlık olarak yakalayan, renklendiren ve yerel olarak arşivleyen açık kaynaklı bir masaüstü uygulamasıdır.

### Temel Özellikler
- **Canlı Bellek Motoru:** IC konuşmalar, /me, /do, PM, telsiz ve SMS kanallarını otomatik filtreler.
- **SS Editörü (SS Maker):** Özelleştirilebilir tipografi, kontur ve Photoshop için tek tıkla şeffaf PNG kopyalama.
- **Siyah Arkaplan Temizleyici (Keyer):** /blind ile alınan siyah chatbox ekran görüntülerini şeffaf metin katmanına dönüştürür.
- **Telsiz & Dispatch Konsolu:** 10-Kodlarını ve anonsları filtreleyen operasyonel görünüm.
- **Çoklu POV Birleştirici:** Farklı oyunculardan alınan logları zaman damgasına göre tek sahnede birleştirir ve tekrarları siler.
- **Akıllı Alt-Tab Bildirimi:** Yalnızca oyundan çıktığınızda adınız geçtiğinde veya PM geldiğinde sesli uyarı verir.
- **5 Dil Desteği:** Türkçe, İngilizce, Rusça, Fransızca ve İspanyolca.

### İndirme
[GitHub Releases Sayfası](https://github.com/create-tools/GTAW-Log-Studio/releases) üzerinden Setup veya Portable sürümü indirebilirsiniz.

</details>

<details>
<summary><b id="русский-обзор">Русский Обзор (Russian)</b></summary>

### Обзор
GTAW Log Studio — это настольное приложение с открытым исходным кодом, предназначенное для игроков GTA World. Оно напрямую подключается к процессу FiveM для парсинга, цветовой разметки и локального архивирования игровых логов в реальном времени без потери FPS.

### Основные возможности
- **Парсинг памяти в реальном времени:** Мгновенное разделение каналов IC, /me, /do, PM, рации и SMS.
- **Студия скриншотов (SS Maker):** Настраиваемая типографика, обводка, тени и копирование прозрачного PNG для Photoshop в один клик.
- **Удаление черного фона (Keyer):** Очистка скриншотов чатбокса /blind в прозрачный слой текста.
- **Консоль диспетчера и рации:** Выделенный терминал с фильтрацией 10-кодов и позывных.
- **Объединение логов Multi-POV:** Хронологическое объединение логов нескольких игроков с удалением дубликатов.
- **Уведомления при Alt-Tab:** Звуковой сигнал срабатывает только при упоминании имени или получении PM, когда игра свернута.

### Скачивание
Скачайте установщик или портативную версию на странице [GitHub Releases](https://github.com/create-tools/GTAW-Log-Studio/releases).

</details>

<details>
<summary><b id="présentation-en-français">Présentation en Français (French)</b></summary>

### Aperçu
GTAW Log Studio est une application de bureau open source conçue pour les joueurs de GTA World. Elle se connecte directement au processus FiveM pour analyser, colorer et archiver les journaux de discussion en temps réel sans baisse de FPS.

### Fonctionnalités principales
- **Moteur de mémoire en direct:** Détection instantanée des canaux IC, /me, /do, PM, Radio et SMS.
- **Studio de captures d'écran (SS Maker):** Typographie personnalisable, contours, ombres et export PNG transparent vers Photoshop en un clic.
- **Suppression du fond noir (Keyer):** Nettoie les captures d'écran de boîte de discussion noire /blind en calques transparents.
- **Console Radio & Dispatch:** Terminal dédié avec filtrage des codes 10 et des indicatifs.
- **Fusion Multi-POV:** Combine les journaux de plusieurs joueurs en une seule chronologie et élimine les doublons.
- **Alertes intelligentes Alt-Tab:** Notification sonore uniquement en cas de mention ou de PM lorsque le jeu n'est pas au premier plan.

### Téléchargement
Téléchargez l'installateur ou la version portable sur la page [GitHub Releases](https://github.com/create-tools/GTAW-Log-Studio/releases).

</details>

<details>
<summary><b id="descripción-en-español">Descripción en Español (Spanish)</b></summary>

### Resumen
GTAW Log Studio es una aplicación de escritorio de código abierto diseñada para jugadores de GTA World. Se conecta directamente al proceso de FiveM para analizar, colorear y archivar los registros de chat en tiempo real sin pérdida de rendimiento.

### Características clave
- **Motor de memoria en vivo:** Detección en tiempo real de canales IC, /me, /do, PM, Radio y SMS.
- **Estudio de capturas de pantalla (SS Maker):** Tipografía personalizable, trazo, sombra y copia de PNG transparente para Photoshop en un clic.
- **Removedor de fondo negro (Keyer):** Limpia las capturas de chatbox negro /blind en capas transparentes de texto.
- **Consola de radio y despacho:** Terminal dedicada para filtrar códigos 10 y llamadas de unidades.
- **Fusión Multi-POV:** Combina registros de varios jugadores cronológicamente y elimina líneas duplicadas.
- **Alertas inteligentes Alt-Tab:** Avisos de audio cuando se menciona tu nombre o llega un PM mientras estás en Alt-Tab.

### Descargas
Descargue el instalador o la versión portátil en la página de [GitHub Releases](https://github.com/create-tools/GTAW-Log-Studio/releases).

</details>

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
