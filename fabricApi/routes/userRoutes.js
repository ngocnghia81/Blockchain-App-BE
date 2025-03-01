const express = require("express");

const userController = require("../controllers/userController");

const router = express.Router();

router.post("/create-pin", userController.createPin);
router.post("/get-pin", userController.getPin);

module.exports = router;
