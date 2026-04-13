const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../models/db');
const { authRequired } = require('../controllers/middleware');

const router = express.Router();

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return cb(new Error('Только jpg/png для аватара'));
    }
    cb(null, true);
  },
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, email, role, xp, level, avatar_path FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

router.post('/avatar', authRequired, avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не выбран.' });
  db.prepare('UPDATE users SET avatar_path = ? WHERE id = ?').run(req.file.filename, req.user.id);
  res.json({ avatar: req.file.filename });
});

router.get('/leaderboard', authRequired, (req, res) => {
  const rows = db
    .prepare("SELECT id, email, xp, level, avatar_path FROM users WHERE role = 'student' ORDER BY xp DESC, level DESC LIMIT 50")
    .all();
  res.json(rows);
});

module.exports = router;
