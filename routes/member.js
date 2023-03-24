const express = require("express");
const router = express.Router();
const { User, validate } = require("../database/userModel");
const { Community } = require("../database/communityModel");
const { Member } = require("../database/memberModel");

const jwt = require("jsonwebtoken");
const { Snowflake } = require("@theinternetfolks/snowflake");

const bcrypt = require("bcrypt");
const { Role } = require("../database/roleModel");

router.post("/", async (req, res) => {
  try {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const secretKey = process.env.JWT;
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        const emailError = {
          status: false,
          errors: [
            {
              message: "You are not authorized to perform this action.",
              code: "NOT_ALLOWED_ACCESS",
            },
          ],
        };
        res.status(500).send({ data: emailError });
      } else {
        const user = await User.findOne({ email: decoded._id });
        const access = await Member.findOne({ user: user.id });
        const rel = await Role.findOne({ id: access.role });
        if (rel.name === "Community Admin") {
          const userData = await User.findOne({ id: req.body.user });
          if (userData) {
            const role = await Role.findOne({ id: req.body.role });
            if (role) {
              const community = await Community.findOne({
                id: req.body.community,
              });
              if (community) {
                const member = await Member.findOne({ user: req.body.user });
                if (member) {
                  const memberError = {
                    status: false,
                    errors: [
                      {
                        message: "User is already added in the community.",
                        code: "RESOURCE_EXISTS",
                      },
                    ],
                  };
                  res.status(500).send({ data: memberError });
                } else {
                  const id = await Snowflake.generate({
                    timestamp: Date.now(),
                  });
                  const newMember = new Member({
                    id: id,
                    user: req.body.user,
                    community: req.body.community,
                    role: req.body.role,
                  });
                  await newMember.save();
                  const data = await Member.findOne({ user: req.body.user });
                  const success = {
                    status: true,
                    content: {
                      data: {
                        id: data.id,
                        community: data.community,
                        user: data.user,
                        role: data.role,
                        created_at: data.createdAt,
                      },
                    },
                  };
                  res.status(200).send({ data: success });
                }
              } else {
                const comError = {
                  status: false,
                  errors: [
                    {
                      param: "community",
                      message: "Community not found.",
                      code: "RESOURCE_NOT_FOUND",
                    },
                  ],
                };
                res.status(500).send({ data: comError });
              }
            } else {
              const roleError = {
                status: false,
                errors: [
                  {
                    param: "role",
                    message: "Role not found.",
                    code: "RESOURCE_NOT_FOUND",
                  },
                ],
              };
              res.status(500).send({ data: roleError });
            }
          } else {
            const userError = {
              status: false,
              errors: [
                {
                  param: "user",
                  message: "User not found.",
                  code: "RESOURCE_NOT_FOUND",
                },
              ],
            };
            res.status(500).send({ data: userError });
          }
        } else {
          const accessError = {
            status: false,
            errors: [
              {
                message:
                  "You are not authorized to perform this action. access",
                code: "NOT_ALLOWED_ACCESS",
              },
            ],
          };
          res.status(500).send({ data: accessError });
        }
      }
    });
  } catch (error) {
    res.status(500).send({ message: "internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { authorization } = req.headers;
    const token = authorization.split(" ")[1];
    const secretKey = process.env.JWT;
    jwt.verify(token, secretKey, async (err, decoded) => {
      if (err) {
        const emailError = {
          status: false,
          errors: [
            {
              message: "You are not authorized to perform this action.",
              code: "NOT_ALLOWED_ACCESS",
            },
          ],
        };
        res.status(500).send({ data: emailError });
      } else {
        const user = await User.findOne({ email: decoded._id });
        const access = await Member.findOne({ user: user.id });
        const rel = await Role.findOne({ id: access.role });
        if (
          rel.name === "Community Admin" ||
          rel.name === "Community Moderator"
        ) {
          const member = await Member.findOne({ user : req.params.id });
          if (member) {
            await Member.deleteOne({ user: req.params.id }).then(() => {
              const success = {
                status: true,
              };
              res.status(200).send({ data: success });
            });
          } else {
            const userError = {
              status: false,
              errors: [
                {
                  message: "Member not found.",
                  code: "RESOURCE_NOT_FOUND",
                },
              ],
            };
            res.status(500).send({ data: userError });
          }
        } else {
          const accessError = {
            status: false,
            errors: [
              {
                message:
                  "You are not authorized to perform this action. access",
                code: "NOT_ALLOWED_ACCESS",
              },
            ],
          };
          res.status(500).send({ data: accessError });
        }
      }
    });
  } catch (error) {
    res.status(500).send({ message: "internal server error" });
  }
});

module.exports = router;
