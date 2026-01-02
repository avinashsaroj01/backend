const express = require("express");
const { createPaste, getPaste } = require("../controller/pasteController");

const router = express.Router();

router.post("/pastes", createPaste);
router.get("/pastes/:id", getPaste);

module.exports = router;
