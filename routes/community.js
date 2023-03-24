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
    if (req.body.name.length >= 2) {
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
          User.findOne({ email: decoded._id }).then(async (user) => {
            const id = await Snowflake.generate({ timestamp: Date.now() });

            const newCommunity = new Community({
              id: id,
              name: req.body.name,
              slug: req.body.name,
              owner: user.id,
            });
            await newCommunity.save();
            const role = await Role.findOne({ name: "Community Admin" });
            const uid = await Snowflake.generate({ timestamp: Date.now() });

            const newMember = new Member({
              id: uid,
              community: id,
              user: user.id,
              role: role.id,
            });
            await newMember.save();
            const communityData = await Community.findOne({ id: id });
            const success = {
              status: true,
              content: {
                data: {
                  id: communityData.id,
                  name: communityData.name,
                  slug: communityData.slug,
                  owner: communityData.owner,
                  created_at: communityData.createdAt,
                  updated_at: communityData.updatedAt,
                },
              },
            };
            res.status(200).send({ data: success });
          });
        }
      });
    } else {
      const inputError = {
        status: false,
        errors: [
          {
            param: "name",
            message: "Name should be at least 2 characters.",
            code: "INVALID_INPUT",
          },
        ],
      };
      res.status(500).send({ data: inputError });
    }
  } catch (error) {
    res.status(500).send({ message: "internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const communityData = await Community.find();
    const total = communityData.length;
    const pages = 10;
    const page = parseInt(req.query.page) || 1;
    const filteredData = await Community.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "id",
          as: "owner",
        },
      },
      {
        $project: {
          _id: 0,
          id: 1,
          name: 1,
          slug: 1,
          owner: { name: 1, id: 1 },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
      .skip(pages * page - pages)
      .limit(pages);
    const data = {
      status: true,
      content: {
        meta: {
          total: total,
          pages: Math.round(pages / 10),
          page: page,
        },
        data: filteredData,
      },
    };
    res.status(200).send({ data: data });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "internal server error" });
  }
});

router.get("/:id/members", async (req, res) => {
  try {
    const communityData = await Community.findOne({ name: req.params.id });
    const memberData = await Member.find({ community: communityData.id });
    const total = memberData.length;
    const pages = 10;
    const page = parseInt(req.query.page) || 1;
    const filteredData = await Member.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "roles",
          localField: "role",
          foreignField: "id",
          as: "role",
        },
      },
      {
        $project: {
          _id: 0,
          id: 1,
          community: 1,
          user: { name: 1, id: 1 },
          role: { name: 1, id: 1 },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ])
      .skip(pages * page - pages)
      .limit(pages);
    const data = {
      status: true,
      content: {
        meta: {
          total: total,
          pages: Math.round(pages / 10),
          page: page,
        },
        data: filteredData,
      },
    };
    res.status(200).send({ data: data });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "internal server error" });
  }
});

router.get("/me/owner", async (req, res) => {
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
              message: "You need to sign in to proceed.",
              code: "NOT_SIGNEDIN",
            },
          ],
        };
        res.status(500).send({ data: emailError });
      } else {
        const userData = await User.findOne({ email: decoded._id });
        const communityData = await Community.aggregate([
          { $match: { owner: userData.id } },
          {
            $project: {
              _id: 0,
              id: 1,
              name: 1,
              slug: 1,
              owner: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ]);
        const success = {
          status: true,
          content: {
            data: communityData,
          },
        };
        res.status(200).send({ data: success });
      }
    });
  } catch (error) {
    res.status(500).send({ message: "internal server error" });
  }
});

router.get("/me/member", async (req, res) => {
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
                message: "You need to sign in to proceed.",
                code: "NOT_SIGNEDIN",
              },
            ],
          };
          res.status(500).send({ data: emailError });
        } else {
          const userData = await User.findOne({ email: decoded._id });
          const communityData = await Community.aggregate([
            { $match: { owner: userData.id } },
            {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "id",
                  as: "owner",
                },
              },
            {
              $project: {
                _id: 0,
                id: 1,
                name: 1,
                slug: 1,
                owner: { name: 1, id: 1 },
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ]);
          const success = {
            status: true,
            content: {
              data: communityData,
            },
          };
          res.status(200).send({ data: success });
        }
      });
    } catch (error) {
      res.status(500).send({ message: "internal server error" });
    }
  });

module.exports = router;
