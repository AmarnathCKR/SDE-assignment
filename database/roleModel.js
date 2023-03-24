const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const roleSchema = new mongoose.Schema(
  {
    id : String,
    name: { type: String },
    scopes: [String],
  },
  { timestamps: true }
);

const Role = mongoose.model("Role", roleSchema);

module.exports = { Role };
