const mongoose = require("mongoose");
//Set URI
const URI = process.env.MONGODB_URI || "mongodb+srv://ckramarnath:Qhq22UVmCQvyeV7y@sdeproject.1fq7t6m.mongodb.net/?retryWrites=true&w=majority";
//Store Connection Object
const db = mongoose.connection;
//Config Object to Avoid Deprecation Warnings
const config = { useNewUrlParser: true, useUnifiedTopology: true };

mongoose.connect(URI, config);

//CONNECTION EVENTS
db.on("open", () => {
  console.log(`You are connected to MongoDB`);
})
  .on("error", (err) => {
    console.log(err);
  })
  .on("close", () => {
    console.log(`You are no longer connected to Mongo`);
  });

module.exports = mongoose
