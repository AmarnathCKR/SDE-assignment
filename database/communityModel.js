const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const communitySchema = new mongoose.Schema(
  {
    id : String,
    name: { type: String },
    slug: { type: String },
    owner: {
      type: String
    },
  },
  { timestamps: true }
);

const Community = mongoose.model("Community", communitySchema);

module.exports = { Community };
