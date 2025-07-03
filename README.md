# Zikra Project

## Overview
Zikra is a web application designed to facilitate the study and recitation of the Quran. It provides tools for displaying Quranic verses, tracking recitation progress, and managing audio recordings. The project consists of a Node.js/Express backend and a static frontend, with additional assets and data for enhanced user experience.

## Project Structure

```
.
├── audios/                # Audio recordings of Quranic classes
├── client/                # Frontend static files and assets
│   ├── Assets/            # Images, fonts, and data (Excel)
│   ├── other/             # Main site HTML, CSS, JS
│   ├── ramzan/            # Special Ramzan site and scripts
│   └── client.rar         # Archived client files
├── server/                # Backend Node.js/Express API
│   ├── app.js             # Main server file
│   ├── data/              # Database connection logic
│   ├── models/            # Mongoose models (e.g., stopwatch)
│   ├── package.json       # Backend dependencies
│   └── All-Distribuation.xlsx # Main data source (Quranic distribution)
└── .gitignore             # Git ignore rules
```

## Features
- **Quranic Verse Display:** Select and display verses by surah, ayah, juz, ruba, nisf, or rukuh.
- **Audio Recording:** Record and manage recitation audio files.
- **Progress Tracking:** Stopwatch and time tracking for recitation sessions.
- **Ramzan Mode:** Special interface and features for Ramzan.
- **Rich Assets:** Custom fonts, images, and Excel-based data for enhanced presentation.

## Backend (server/)
- **Stack:** Node.js, Express, Mongoose, XLSX
- **API Endpoints:**
  - `/data` - Fetch verses by surah/ayah range
  - `/juz` - Fetch verses by juz
  - `/ruba`, `/nisf`, `/rukuh` - Fetch by ruba, nisf, or rukuh
  - Additional endpoints for stopwatch and progress tracking
- **Database:** MongoDB (local, dbName: zikra)
- **Data Source:** `All-Distribuation.xlsx` (Quranic data and distribution)

## Frontend (client/)
- **Main Site:** `client/other/index.html` (RTL, Arabic interface)
- **Ramzan Site:** `client/ramzan/ramzan.html` (special features for Ramzan)
- **Assets:**
  - **Images:** Quranic frames, backgrounds, etc.
  - **Fonts:** Custom Arabic fonts (Jameel-Noori, Hafs)
  - **Data:** Excel file for verse lookup and distribution
- **Scripts:**
  - `script.js` (main logic)
  - `ramzanScript.js`, `ramzanCopy.js` (Ramzan features)

## Audio (audios/)
Contains MP3 recordings of Quranic classes, named by date.

## Setup & Usage

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (local instance)

### Backend Setup
1. Navigate to the `server/` directory:
   ```sh
   cd server
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   npm start
   ```
   The server runs on `http://localhost:3000` by default.

### Frontend Usage
- Open `client/other/index.html` in your browser for the main site.
- Open `client/ramzan/ramzan.html` for the Ramzan site.

### Audio Files
- Place new audio recordings in the `audios/` directory as needed.

## Notes
- The main data file (`All-Distribuation.xlsx`) must be present in both `server/` and `client/Assets/data/` for full functionality.
- The backend expects a local MongoDB instance running on the default port.
- All static assets (images, fonts) are loaded locally for best performance.

## License
This project is for educational and non-commercial use. 