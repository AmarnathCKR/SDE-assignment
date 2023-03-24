const router = require("express").Router();
const { User } = require("../database/userModel");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Snowflake } = require("@theinternetfolks/snowflake");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.JWT, { expiresIn: "1d" });
};

router.post("/signup", async (req, res) => {
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
    const member = await User.findOne({ name: req.body.name });
    if (member) {
      const exist = {
        status: false,
        errors: [
          {
            param: "name",
            message: "Name already exist",
            code: "INVALID_INPUT",
          },
        ],
      };
      res.status(500).send({ data: exist });
    } else {
      const match = req.body.email.match(
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
      );
      if (match) {
        if (req.body.password < 7) {
          const passError = {
            status: false,
            errors: [
              {
                param: "password",
                message: "password should be min 6",
                code: "INVALID_INPUT",
              },
            ],
          };
          res.status(500).send({ data: passError });
        } else {
          const id = await Snowflake.generate({ timestamp: Date.now() });
          const hashPassword = await bcrypt.hash(req.body.password, 10);
          const newUser = new User({
            id: id,
            name: req.body.name,
            email: req.body.email,
            password: hashPassword,
          });
          await newUser.save();
          const users = await User.findOne({ name: req.body.name });
          const token = await createToken(req.body.email);

          const success = {
            status: true,
            content: {
              data: {
                id: users.id,
                name: users.name,
                email: users.email,
                created_at: users.createdAt,
              },
              meta: {
                access_token: token,
              },
            },
          };
          res.status(200).send({ data: success });
        }
      } else {
      }
    }
  }
});

router.get("/me", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization.split(" ")[1];
  const secretKey = process.env.JWT;
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      const emailError = {
        status: false,
        errors: [
          {
            message: "You need to sign in to proceed.",
            code: "NOT_SIGNEDIN",
          },
        ],
      };
      res.status(500).send({ data: emailError });
    } else {
      User.findOne({ email: decoded._id }).then((user) => {
        const success = {
          status: true,
          content: {
            data: {
              id: user.id,
              name: user.name,
              email: user.email,
              created_at: user.createdAt,
            },
          },
        };
        res.status(200).send({ data: success });
      });
    }
  });
});

module.exports = router;
