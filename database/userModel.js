const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const userSchema = new mongoose.Schema(
  {
    id : String,
    name: { type: String },
    email: { type: String },
    password: { type: String },
    
  },
  { timestamps: true }
);

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this.id }, process.env.JWT, {
    expiresIn: "7d",
  });
  return token;
};

const User = mongoose.model("User", userSchema);

const validate = (data) => {
  const schema = Joi.object({
    name: Joi.string().label("Name"),
    email: Joi.string().label("Email"),

    password: passwordComplexity().label("Password"),
  });
  return schema.validate(data);
};

module.exports = { User, validate };
