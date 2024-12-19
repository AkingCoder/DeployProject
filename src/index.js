import app from "./app.js";
import dbConnect from "./db/index.js";
import dotenv from "dotenv";


dotenv.config({
  path: "../.env"
});




dbConnect()
  .then(() => {
    app.listen(3000, () => {
      console.log(`http://localhost:${3000}`)
    })
  }).catch((err) => {
    console.error("Failed to connect to database", err);
  });
