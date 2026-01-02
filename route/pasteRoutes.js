const express = require("express");
const {
  createPaste,
  getPaste,
  getPasteHtml,
} = require("../controller/pasteController");

const router = express.Router();

router.post("/pastes", createPaste);
router.get("/pastes/:id", getPaste);
router.get("/p/:id", getPasteHtml);


module.exports = router;
