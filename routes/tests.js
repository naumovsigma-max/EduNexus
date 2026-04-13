const express = require('express');
const db = require('../models/db');
const { authRequired } = require('../controllers/middleware');

const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const tests = db.prepare('SELECT id, title, creator_id, created_at FROM tests ORDER BY created_at DESC').all();
  res.json(tests);
});

router.post('/', authRequired, (req, res) => {
  const { title, questions } = req.body;
  if (!title || !Array.isArray(questions) || !questions.length) {
    return res.status(400).json({ error: 'Добавьте название и вопросы.' });
  }

  const result = db
    .prepare('INSERT INTO tests (title, questions_json, creator_id) VALUES (?, ?, ?)')
    .run(title, JSON.stringify(questions), req.user.id);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.post('/:id/attempt', authRequired, (req, res) => {
  if (req.user.role !== 'student') return res.status(403).json({ error: 'Только ученики могут проходить тесты.' });

  const test = db.prepare('SELECT * FROM tests WHERE id = ?').get(req.params.id);
  if (!test) return res.status(404).json({ error: 'Тест не найден.' });

  const { answers } = req.body;
  const questions = JSON.parse(test.questions_json);
  let score = 0;

  questions.forEach((q, i) => {
    if (q.correctIndex === answers?.[i]) score += 1;
  });

  db.prepare('INSERT INTO test_attempts (test_id, student_id, score, max_score) VALUES (?, ?, ?, ?)').run(
    test.id,
    req.user.id,
    score,
    questions.length
  );

  const xpGain = score * 10;
  db.prepare('UPDATE users SET xp = xp + ?, level = 1 + ((xp + ?) / 100) WHERE id = ?').run(xpGain, xpGain, req.user.id);

  res.json({ score, maxScore: questions.length, xpGain });
});

module.exports = router;
