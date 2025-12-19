import express from "express";
import pkg from "xlsx";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./data/database.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';

// Initialize CSV update scheduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const csvSchedulerPath = join(__dirname, 'csv-scheduler.js');

// Start the CSV scheduler as a separate process
const csvScheduler = spawn('node', [csvSchedulerPath], {
  detached: true,
  stdio: ['ignore', process.stdout, process.stderr]
});

// Log that we've started the scheduler
console.log('CSV update scheduler started (PID: ' + csvScheduler.pid + ')');

const app = express();
const { readFile } = pkg;

app.use(cors({}));

app.use(express.json());

connectDB();
dotenv.config();

// --- In-memory caching of Excel data ---
let cachedWorkbook = readFile("All-Distribuation.xlsx");
let cachedDatabaseSheet = cachedWorkbook.Sheets["Database"];
let cachedRukuSheet = cachedWorkbook.Sheets["Ruku"];
let cachedRubaSheet = cachedWorkbook.Sheets["Ruba"];
let cachedNisafSheet = cachedWorkbook.Sheets["nisaf"];

let rukuhs = [];

app.get("/", (req, res) => {
  res.send("Testing For CICD");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/data", (req, res) => {
  const input = req.query.input; // Assuming the input is passed as a query parameter

  // Use cachedDatabaseSheet instead of reading file
  const databaseSheet = cachedDatabaseSheet;

  // Extract the surah number and ayah range from the input
  const regex = /\((\d+):(\d+)\)\((\d+):(\d+)\)/;
  const [, surahStart, ayahStart, surahEnd, ayahEnd] = input.match(regex);

  // Convert the values to numbers
  const surahStartNum = parseInt(surahStart, 10);
  const ayahStartNum = parseInt(ayahStart, 10);
  const surahEndNum = parseInt(surahEnd, 10);
  const ayahEndNum = parseInt(ayahEnd, 10);

  // Iterate over the rows in the "Database" sheet and filter the relevant data
  const filteredData = [];
  const range = databaseSheet["!ref"].split(":");
  const startRow = parseInt(range[0].replace(/\D/g, ""), 10);
  const endRow = parseInt(range[1].replace(/\D/g, ""), 10);

  let isSurahStarted = false; // Flag to indicate if the surah has started
  let currentSurahNo = null; // Track the current surah number
  for (let i = startRow; i <= endRow; i++) {
    const surahName = databaseSheet[`F${i}`].v;
    const rowSurahNo = databaseSheet[`E${i}`].v;
    const rowAyahNo = databaseSheet[`K${i}`].v;
    const rowAyahText = databaseSheet[`M${i}`].v;
    const rukuhNo = databaseSheet[`Q${i}`].v;

    if (rowSurahNo !== currentSurahNo) {
      // New surah detected
      currentSurahNo = rowSurahNo;
      isSurahStarted = false; // Reset the flag for the new surah
    }

    if (
      !isSurahStarted &&
      rowSurahNo >= surahStartNum &&
      rowSurahNo <= surahEndNum &&
      rowAyahNo >= ayahStartNum
    ) {
      isSurahStarted = true; // Mark the start of the surah
      
      // Add an empty line first with a special marker
      filteredData.push({
        surahName: surahName,
        surahNo: rowSurahNo,
        ayahNo: -1, // Special code for empty line
        ayahText: "BREAK_MARKER", // Special marker for line break
        rukuhNo: rukuhNo,
      });

      // Add the bismillah as a separate entry
      filteredData.push({
        surahName: surahName,
        surahNo: rowSurahNo,
        ayahNo: 1,
        ayahText: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
        rukuhNo: rukuhNo,
      });

      // Add another empty line after bismillah
      filteredData.push({
        surahName: surahName,
        surahNo: rowSurahNo,
        ayahNo: -1, // Special code for empty line
        ayahText: "BREAK_MARKER", // Special marker for line break
        rukuhNo: rukuhNo,
      });
    }

    if (isSurahStarted) {
      // Add the regular verse
      filteredData.push({
        surahName: surahName,
        surahNo: rowSurahNo,
        ayahNo: rowAyahNo,
        ayahText: rowAyahText,
        rukuhNo: rukuhNo,
      });

      // Optional: Add a line break after each verse
      // Uncomment if you want breaks between all verses
      /*
      filteredData.push({
        surahName: surahName,
        surahNo: rowSurahNo,
        ayahNo: -1,
        ayahText: "BREAK_MARKER",
        rukuhNo: rukuhNo,
      });
      */

      if (rowSurahNo === surahEndNum && rowAyahNo === ayahEndNum) {
        // Add a line break at the end of the surah
        filteredData.push({
          surahName: surahName,
          surahNo: rowSurahNo,
          ayahNo: -1, // Changed from rowAyahNo + 1
          ayahText: "BREAK_MARKER",
          rukuhNo: rukuhNo,
        });
        break; // Stop iterating after reaching the end ayah of the last specified surah
      }
    }
  }

  res.json(filteredData);
});

app.get("/juz", (req, res) => {
  const juzValue = req.query.juz;
  const databaseSheet = cachedDatabaseSheet;

  const filteredData = [];
  const range = databaseSheet["!ref"].split(":");
  const startRow = parseInt(range[0].replace(/\D/g, ""), 10);
  const endRow = parseInt(range[1].replace(/\D/g, ""), 10);

  for (let i = startRow; i <= endRow; i++) {
    const rowJuzValue = databaseSheet[`B${i}`].v;

    if (rowJuzValue == juzValue) {
      const surahNo = databaseSheet[`E${i}`].v;
      const surahName = databaseSheet[`F${i}`].v;
      const ayahNo = databaseSheet[`K${i}`].v;
      const ayahText = databaseSheet[`M${i}`].v;
      filteredData.push({ surahNo, surahName, ayahNo, ayahText });
    }
  }

  res.json(filteredData);
});

function getValueFromSheet(req, res, sheetName, sheetNo) {
  const parahNo = req.query.parahNo;
  const valueNo = req.query[sheetNo];
  let sheet;
  if (sheetName === "Ruba") sheet = cachedRubaSheet;
  else if (sheetName === "nisaf") sheet = cachedNisafSheet;
  else sheet = cachedRukuSheet;

  const columnLetter = String.fromCharCode(65 + parseInt(valueNo));
  const cellAddress = `${columnLetter}${parseInt(parahNo) + 1}`;
  const value = sheet[cellAddress]?.v;

  if (value) {
    res.json({ ayahNo: value });
  } else {
    res.status(404).json({ error: `${sheetName} value not found` });
  }
}

app.get("/ruba", (req, res) => {
  getValueFromSheet(req, res, "Ruba", "rubaNo");
});

app.get("/nisf", (req, res) => {
  getValueFromSheet(req, res, "nisaf", "nisfNo");
});

app.get("/rukuh", (req, res) => {
  const surahNo = req.query.surahNo;
  const rukuhNo = req.query.rukuNo;
  const sheet = cachedRukuSheet;

  const filteredData = [];
  const range = sheet["!ref"].split(":");
  const startRow = parseInt(range[0].replace(/\D/g, ""), 10);
  const endRow = parseInt(range[1].replace(/\D/g, ""), 10);

  for (let i = startRow; i <= endRow; i++) {
    const surahValue = sheet[`A${i}`].v;
    const rukuhValue = sheet[`B${i}`].v;

    if (surahValue == surahNo) {
      if (!rukuhNo || rukuhValue == rukuhNo) {
        const ayahNo = sheet[`C${i}`].v;
        filteredData.push({ rukuhNo: rukuhValue, ayahNo });
        if (rukuhNo) {
          break;
        }
      }
    }
  }

  if (filteredData.length === 0) {
    res
      .status(404)
      .json({ error: "Rukuh not found for the specified surahNo and rukuhNo" });
  } else {
    res.json(filteredData);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Stopwatch

import { Stopwatch } from "./models/stopwatch.js";

const Stopwatchs = async (req, res) => {
  try {
    const { startTime, endTime, ayahText } = req.body;
    console.log(startTime, endTime, ayahText);

    // Create a new document based on the model
    const newRecord = new Stopwatch({
      startTime,
      endTime,
      ayahText,
    });

    // Save the document to the database
    await newRecord.save();

    res.status(200).json({
      success: true,
      ayahText,
      startTime,
      endTime,
    });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

app.post("/data-collection", Stopwatchs);

// New API endpoints for the enhanced website

// Get list of available audio files (for Quran audio page)
app.get("/audio-list", (req, res) => {
  try {
    // In a real implementation, you would scan the audios/full-quran directory
    // For now, we'll return a static list that matches the expected Para structure
    const audioList = [];
    
    for (let i = 1; i <= 30; i++) {
      audioList.push({
        para: i,
        title: `الجزء ${i}`,
        filename: `para-${i}.mp3`,
        url: `/audios/full-quran/para-${i}.mp3`,
        duration: "45:30", // You can implement actual duration detection
        size: "25.4 MB", // You can implement actual file size detection
        available: true // You can check if file actually exists
      });
    }
    
    res.json({
      success: true,
      count: audioList.length,
      audios: audioList
    });
  } catch (error) {
    console.error("Error fetching audio list:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching audio list"
    });
  }
});

// Get audio metadata for a specific Para
app.get("/audio/:para", (req, res) => {
  try {
    const para = parseInt(req.params.para);
    
    if (para < 1 || para > 30) {
      return res.status(400).json({
        success: false,
        message: "Invalid para number. Must be between 1 and 30."
      });
    }
    
    // Para information with Arabic names and descriptions
    const paraInfo = {
      1: { title: 'الفاتحة', subtitle: 'من سورة الفاتحة إلى سورة البقرة آية 141' },
      2: { title: 'سيقول السفهاء', subtitle: 'من سورة البقرة آية 142 إلى آية 252' },
      3: { title: 'تلك الرسل', subtitle: 'من سورة البقرة آية 253 إلى سورة آل عمران آية 92' },
      4: { title: 'لن تنالوا البر', subtitle: 'من سورة آل عمران آية 93 إلى آية 200' },
      5: { title: 'والمحصنات', subtitle: 'من سورة النساء آية 1 إلى آية 87' },
      6: { title: 'لا يحب الله', subtitle: 'من سورة النساء آية 88 إلى آية 147' },
      7: { title: 'وإذا سمعوا', subtitle: 'من سورة النساء آية 148 إلى سورة المائدة آية 81' },
      8: { title: 'ولو أننا', subtitle: 'من سورة المائدة آية 82 إلى سورة الأنعام آية 110' },
      9: { title: 'قال الملأ', subtitle: 'من سورة الأنعام آية 111 إلى سورة الأعراف آية 87' },
      10: { title: 'واعلموا', subtitle: 'من سورة الأعراف آية 88 إلى سورة الأنفال آية 40' },
      11: { title: 'يعتذرون', subtitle: 'من سورة الأنفال آية 41 إلى سورة التوبة آية 92' },
      12: { title: 'وما من دابة', subtitle: 'من سورة التوبة آية 93 إلى سورة هود آية 5' },
      13: { title: 'وما أبرئ', subtitle: 'من سورة هود آية 6 إلى سورة يوسف آية 52' },
      14: { title: 'ربما', subtitle: 'من سورة يوسف آية 53 إلى سورة إبراهيم آية 52' },
      15: { title: 'سبحان الذي', subtitle: 'من سورة الحجر آية 1 إلى سورة النحل آية 128' },
      16: { title: 'قال ألم', subtitle: 'من سورة الإسراء آية 1 إلى سورة الكهف آية 74' },
      17: { title: 'اقترب للناس', subtitle: 'من سورة الكهف آية 75 إلى سورة طه آية 135' },
      18: { title: 'قد أفلح', subtitle: 'من سورة الأنبياء آية 1 إلى سورة الحج آية 78' },
      19: { title: 'وقال الذين', subtitle: 'من سورة المؤمنون آية 1 إلى سورة الفرقان آية 20' },
      20: { title: 'أمن خلق', subtitle: 'من سورة الفرقان آية 21 إلى سورة النمل آية 55' },
      21: { title: 'اتل ما أوحي', subtitle: 'من سورة النمل آية 56 إلى سورة العنكبوت آية 45' },
      22: { title: 'ومن يقنت', subtitle: 'من سورة العنكبوت آية 46 إلى سورة الأحزاب آية 30' },
      23: { title: 'وما لي', subtitle: 'من سورة الأحزاب آية 31 إلى سورة يس آية 27' },
      24: { title: 'فمن أظلم', subtitle: 'من سورة يس آية 28 إلى سورة الزمر آية 31' },
      25: { title: 'إليه يرد', subtitle: 'من سورة الزمر آية 32 إلى سورة فصلت آية 46' },
      26: { title: 'حم', subtitle: 'من سورة الأحقاف آية 1 إلى سورة الذاريات آية 30' },
      27: { title: 'قال فما خطبكم', subtitle: 'من سورة الذاريات آية 31 إلى سورة الحديد آية 29' },
      28: { title: 'قد سمع الله', subtitle: 'من سورة المجادلة آية 1 إلى سورة التحريم آية 12' },
      29: { title: 'تبارك الذي', subtitle: 'من سورة الملك آية 1 إلى سورة المرسلات آية 50' },
      30: { title: 'عم يتساءلون', subtitle: 'من سورة النبأ إلى سورة الناس' }
    };
    
    const info = paraInfo[para] || { title: `الجزء ${para}`, subtitle: 'وصف الجزء' };
    
    res.json({
      success: true,
      para: para,
      title: info.title,
      subtitle: info.subtitle,
      filename: `para-${para}.mp3`,
      url: `/audios/full-quran/para-${para}.mp3`,
      duration: "45:30", // You can implement actual duration detection
      size: "25.4 MB" // You can implement actual file size detection
    });
  } catch (error) {
    console.error("Error fetching audio metadata:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching audio metadata"
    });
  }
});

// YouTube search proxy endpoint (optional - for server-side search)
app.post("/youtube-search", async (req, res) => {
  try {
    const { query, channelId, apiKey, pageToken, maxResults = 12 } = req.body;
    
    if (!query || !channelId || !apiKey) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters: query, channelId, or apiKey"
      });
    }
    
    // This endpoint can be used if you want to handle YouTube API calls server-side
    // to hide your API key from the client
    const params = new URLSearchParams({
      key: apiKey,
      channelId: channelId,
      part: 'snippet',
      type: 'video',
      q: query,
      maxResults: maxResults,
      order: 'relevance',
      ...(pageToken && { pageToken })
    });
    
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
    }
    
    res.json({
      success: true,
      ...data
    });
  } catch (error) {
    console.error("YouTube search error:", error);
    res.status(500).json({
      success: false,
      message: "Error performing YouTube search",
      error: error.message
    });
  }
});

// Analytics endpoint for tracking usage (optional)
app.post("/analytics", async (req, res) => {
  try {
    const { event, data, timestamp = new Date() } = req.body;
    
    // You can implement analytics tracking here
    // For example, track which pages are visited, searches performed, etc.
    console.log("Analytics event:", { event, data, timestamp });
    
    res.json({
      success: true,
      message: "Analytics data recorded"
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error recording analytics data"
    });
  }
});