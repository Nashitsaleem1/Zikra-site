import mongoose from "mongoose";

export const connectDB = () => {
  mongoose
    .connect("mongodb://0.0.0.0:27017", {
      dbName: "zikra",
    })
    .then(() => {
      console.log("Database Connected");
    })
    .catch((e) => {
      console.log(e);
    });
};
