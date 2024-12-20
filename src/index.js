import app from "./app.js";
import dbConnect from "./db/index.js";
import dotenv from "dotenv";


dotenv.config();




dbConnect()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`http://localhost:${process.env.PORT}`);
    })
  }).catch((err) => {
    console.error("Failed to connect to database", err);
  });
