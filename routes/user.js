const express = require("express");
const router = express.Router();
const { Role } = require("../database/roleModel");
const { Member } = require("../database/memberModel");
const { Snowflake } = require("@theinternetfolks/snowflake");

const jwt = require("jsonwebtoken");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT, { expiresIn: "1d" });
};

router.post("/role", async (req, res) => {
  if (req.body.name) {
    if (req.body.name.length <= 2) {
      
      const stat = {
        status: false,
        errors: [
          {
            param: "name",
            message: "Name should be at least 2 characters.",
            code: "INVALID_INPUT",
          },
        ],
      };
      res.status(500).send({ data: stat });
    } else {
      const member = await Role.findOne({ name: req.body.name });
      if (member) {
        const exist = {
          status: false,
          errors: [
            {
              param: "name",
              message: "Name should already exist",
              code: "INVALID_INPUT",
            },
          ],
        };
        res.status(500).send({ data: exist });
      } else {
        const id = await Snowflake.generate({ timestamp: Date.now() });

        const newRole = new Role({
          id: id,
          name: req.body.name,
        });
        await newRole.save();
        const roles = await Role.findOne({name : req.body.name})
        const success = {
          status: true,
          content: {
            data: roles,
          },
        };
        res.status(200).send({ data: success });
      }
    }
    
  } else {
    res.status(500).send({ message: "No input received" });
  }
});

router.get("/role", async (req, res) => {
  console.log(req.query.page)
  const allData = await Role.find()
  const total = allData.length
  const pages = 10
  const page = parseInt(req.query.page) || 1;
  const finalData = await Role.find().skip(pages*page - pages).limit(pages)
  const data = {
    "status": true,
    "content": {
      "meta": {
        "total": total,
        "pages": Math.round(pages/10),
        "page": page,
      },
      "data":finalData
    }
  }
  res.status(200).send({ data: data });
});



module.exports = router;
