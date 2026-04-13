const express = require('express');
const db = require('../models/db');
const { authRequired, rolesAllowed } = require('../controllers/middleware');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const tasks = db.prepare('SELECT * FROM daily_tasks ORDER BY created_at DESC LIMIT 30').all();
  res.json(tasks);
});

router.post('/', authRequired, rolesAllowed('teacher', 'admin'), (req, res) => {
  const { title, description, xpReward } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'Укажите title и description.' });

  const result = db
    .prepare('INSERT INTO daily_tasks (title, description, xp_reward, created_by) VALUES (?, ?, ?, ?)')
    .run(title, description, Number(xpReward) || 10, req.user.id);

  res.status(201).json({ id: result.lastInsertRowid });
});

module.exports = router;
