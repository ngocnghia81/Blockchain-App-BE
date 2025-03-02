const express = require("express");

const userController = require("../controllers/userController");

const router = express.Router();

router.post("/create-pin", userController.createPin);
router.get("/get-pin", userController.getPin);
router.get("/", userController.getUsers);
router.get("/:id", userController.getUserDetail);

module.exports = router;
