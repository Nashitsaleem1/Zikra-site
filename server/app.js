import express from "express";
import pkg from "xlsx";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./data/database.js";
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
  res.send("Working");
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