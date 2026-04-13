const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../models/db');
const { authRequired, rolesAllowed } = require('../controllers/middleware');

const router = express.Router();

const allowedMimes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/jpeg',
  'image/png',
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimes.has(file.mimetype)) {
      return cb(new Error('Недопустимый тип файла'));
    }
    cb(null, true);
  },
});

router.get('/', (req, res) => {
  const status = req.query.status;
  let rows;

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    rows = db.prepare('SELECT * FROM materials WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    rows = db.prepare("SELECT * FROM materials WHERE status = 'approved' ORDER BY created_at DESC").all();
  }

  res.json(rows);
});

router.post('/guest-upload', upload.single('file'), (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !description || !req.file) return res.status(400).json({ error: 'Заполните все поля.' });

  const result = db
    .prepare(
      `INSERT INTO materials (title, description, type, category, file_path, file_name, mime_type, status, uploader_role)
       VALUES (?, ?, 'file', ?, ?, ?, ?, 'pending', 'guest')`
    )
    .run(title, description, category || null, req.file.filename, req.file.originalname, req.file.mimetype);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Материал отправлен на модерацию.' });
});

router.post('/upload', authRequired, upload.single('file'), (req, res) => {
  const { title, description, category } = req.body;
  if (!title || !description || !req.file) return res.status(400).json({ error: 'Заполните все поля.' });

  const result = db
    .prepare(
      `INSERT INTO materials (title, description, type, category, file_path, file_name, mime_type, status, uploader_id, uploader_role)
       VALUES (?, ?, 'file', ?, ?, ?, ?, 'pending', ?, ?)`
    )
    .run(title, description, category || null, req.file.filename, req.file.originalname, req.file.mimetype, req.user.id, req.user.role);

  res.status(201).json({ id: result.lastInsertRowid, message: 'Материал отправлен на модерацию.' });
});

router.patch('/:id/moderate', authRequired, rolesAllowed('admin'), (req, res) => {
  const { action } = req.body;
  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Неверное действие модерации.' });
  }

  const result = db.prepare('UPDATE materials SET status = ? WHERE id = ?').run(action, req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Материал не найден.' });

  res.json({ message: `Материал ${action === 'approved' ? 'одобрен' : 'отклонен'}.` });
});

module.exports = router;
