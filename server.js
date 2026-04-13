const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

require('./models/db');

const authRoutes = require('./routes/auth');
const materialsRoutes = require('./routes/materials');
const usersRoutes = require('./routes/users');
const testsRoutes = require('./routes/tests');
const tasksRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tests', testsRoutes);
app.use('/api/tasks', tasksRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`EduNexus server started on http://localhost:${PORT}`);
});
