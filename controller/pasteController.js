const mongoose = require('mongoose')
const Paste = require("../model/Paste");
const getNow = require("../utils/getNow");

const createPaste = async (req, res) => {
  try {
    const { content, ttl_seconds, max_views } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!content || typeof content !== "string" || content.trim() === "") {
      return res.status(400).json({ error: "content is required" });
    }

    if (
      ttl_seconds !== undefined &&
      (!Number.isInteger(ttl_seconds) || ttl_seconds < 1)
    ) {
      return res.status(400).json({ error: "ttl_seconds must be >= 1" });
    }

    if (
      max_views !== undefined &&
      (!Number.isInteger(max_views) || max_views < 1)
    ) {
      return res.status(400).json({ error: "max_views must be >= 1" });
    }

    /* ---------- EXPIRY CALCULATION ---------- */
    let expiresAt = null;
    if (ttl_seconds) {
      const now = getNow(req);
      expiresAt = new Date(now.getTime() + ttl_seconds * 1000);
    }

    /* ---------- CREATE PASTE ---------- */
    const paste = await Paste.create({
      content,
      expiresAt,
      maxViews: max_views ?? null,
    });

    return res.status(201).json({
      id: paste._id,
      url: `${req.protocol}://${req.get("host")}/p/${paste._id}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" });
  }
};

const getPaste = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ error: "paste not found" });
    }

    const paste = await Paste.findById(id);

    if (!paste) {
      return res.status(404).json({ error: "paste not found" });
    }

    const now = getNow(req);

    /* ---------- EXPIRY CHECK ---------- */
    if (paste.expiresAt && now >= paste.expiresAt) {
      return res.status(404).json({ error: "paste expired" });
    }

    /* ---------- VIEW LIMIT CHECK ---------- */
    if (paste.maxViews !== null && paste.viewsUsed >= paste.maxViews) {
      return res.status(404).json({ error: "view limit exceeded" });
    }

    /* ---------- INCREMENT VIEW COUNT (ATOMIC) ---------- */
    paste.viewsUsed += 1;
    await paste.save();

    const remainingViews =
      paste.maxViews === null
        ? null
        : Math.max(paste.maxViews - paste.viewsUsed, 0);

    return res.status(200).json({
      content: paste.content,
      remaining_views: remainingViews,
      expires_at: paste.expiresAt || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal server error" });
  }
};

const getPasteHtml = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send("Not Found");
    }

    const paste = await Paste.findById(id);

    if (!paste) {
      return res.status(404).send("Not Found");
    }

    const now = getNow(req);

    /* ---------- EXPIRY CHECK ---------- */
    if (paste.expiresAt && now >= paste.expiresAt) {
      return res.status(404).send("Not Found");
    }

    /* ---------- VIEW LIMIT CHECK ---------- */
    if (paste.maxViews !== null && paste.viewsUsed >= paste.maxViews) {
      return res.status(404).send("Not Found");
    }

    /* ---------- SAFE HTML RENDER ---------- */
    const escapedContent = paste.content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Paste</title>
          <style>
            body { font-family: monospace; padding: 20px; background: #f7f7f7; }
            pre { background: #fff; padding: 16px; border-radius: 6px; }
          </style>
        </head>
        <body>
          <pre>${escapedContent}</pre>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  createPaste,
  getPaste,
  getPasteHtml,
};
