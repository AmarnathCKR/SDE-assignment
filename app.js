require('./database/db')
const express = require("express");
const app = express();
const path=require('path');
const auth = require("./routes/auth");
const member = require("./routes/member");
const user = require("./routes/user")
const community = require("./routes/community");
const cors = require("cors")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors(
//     {
//         origin:["http://localhost:3001"],
//         methods:['GET','POST','PUT','DELETE'],
//         credentials:true
//     }
//     ))

app.use("/v1/", user);
app.use("/v1/auth",auth);
app.use("/v1/member",member);
app.use("/v1/community",community);

require("dotenv").config();
const PORT = 3000;
app.listen(PORT, (err) => {
  if (err) {
    console.log("Error starting server: " + err);
    
  } else {
    console.log("Listening on http://localhost:3000");
  }
});