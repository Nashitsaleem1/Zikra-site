import mongoose from "mongoose";

const StopwatchSchema = new mongoose.Schema({
  ayahText: {
    type: String,
  },
  startTime: {
    type: String,
  },
  endTime: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

// Define a function to get the collection name based on the current date
const getCollectionName = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // Months are zero-indexed
  const day = currentDate.getDate();
  return `ZikraClass_${year}_${month}_${day}`;
};

export const Stopwatch = mongoose.model(
  "Stopwatch",
  StopwatchSchema,
  getCollectionName()
);
