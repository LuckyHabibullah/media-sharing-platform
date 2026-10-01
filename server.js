const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'media.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([
    {
      id: 'demo-1',
      title: 'Sky Drift',
      type: 'Game',
      category: 'Games',
      description: 'A racing game demo for quick gaming fun.',
      fileUrl: '',
      fileName: '',
      size: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: 'Night City Stories',
      type: 'Movie',
      category: 'Movies',
      description: 'Action-packed movie night favorite.',
      fileUrl: '',
      fileName: '',
      size: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 'demo-3',
      title: 'Photo Backup Pack',
      type: 'File',
      category: 'Files',
      description: 'Collection of important files and backups.',
      fileUrl: '',
      fileName: '',
      size: 0,
      createdAt: new Date().toISOString()
    }
  ], null, 2));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024
  }
});

const readMedia = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
const writeMedia = (items) => fs.writeFileSync(DB_PATH, JSON.stringify(items, null, 2));

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Media sharing platform is running' });
});

app.get('/api/media', (req, res) => {
  const { category, search } = req.query;
  let items = readMedia();

  if (category && category !== 'all') {
    items = items.filter(item => item.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(item =>
      [item.title, item.category, item.type, item.description]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }

  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(items);
});

app.get('/api/media/:id', (req, res) => {
  const item = readMedia().find(media => media.id === req.params.id);

  if (!item) {
    return res.status(404).json({ message: 'Media not found' });
  }

  res.json(item);
});

app.post('/api/media', upload.single('file'), (req, res) => {
  const { title, type, category, description } = req.body;

  if (!title || !type || !category) {
    return res.status(400).json({ message: 'Title, type and category are required.' });
  }

  const newItem = {
    id: crypto.randomUUID(),
    title: title.trim(),
    type,
    category,
    description: description ? description.trim() : '',
    fileUrl: req.file ? `/uploads/${req.file.filename}` : '',
    fileName: req.file ? req.file.originalname : '',
    size: req.file ? req.file.size : 0,
    createdAt: new Date().toISOString()
  };

  const items = readMedia();
  items.unshift(newItem);
  writeMedia(items);

  res.status(201).json(newItem);
});

app.get('/share/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Media sharing platform is running on http://localhost:${PORT}`);
});
