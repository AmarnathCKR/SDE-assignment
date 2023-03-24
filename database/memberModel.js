const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const memberSchema = new mongoose.Schema(
  {
    id : String,
    community: String,
    user: String,
    role : String
  },
  { timestamps: true }
);

const Member = mongoose.model("Member", memberSchema);

module.exports = { Member };
