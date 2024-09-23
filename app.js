const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = import('nanoid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pastebin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Paste schema and model
const pasteSchema = new mongoose.Schema({
  content: String,
  pasteId: { type: String, unique: true },
  ip: String,  // New field to store user's IP
  createdAt: { type: Date, default: Date.now },
});

const Paste = mongoose.model('Paste', pasteSchema);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Route Admin
app.get('/admin', async (req, res) => {
  const pastes = await Paste.find({});
  res.render('admin', { pastes });
});

// Route to create a new paste
app.post('/create', async (req, res) => {
  const content = req.body.content;
  const pasteId = nanoid(10);
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // Get user's IP address
  const newPaste = new Paste({ content, pasteId, ip });
  await newPaste.save();
  res.redirect(`/${pasteId}`);
});

// Route to display a paste by its ID (must be placed below /admin)
app.get('/:id', async (req, res) => {
  const pasteId = req.params.id;
  const paste = await Paste.findOne({ pasteId });
  if (paste) {
    res.render('paste', { content: paste.content });
  } else {
    res.status(404).send('Paste not found');
  }
});

// Route to modify a paste
app.post('/admin/edit/:id', async (req, res) => {
  const pasteId = req.params.id;
  const newContent = req.body.content;
  await Paste.updateOne({ pasteId }, { content: newContent });
  res.redirect('/admin');
});

// Route to delete a paste
app.post('/admin/delete/:id', async (req, res) => {
  const pasteId = req.params.id;
  await Paste.deleteOne({ pasteId });
  res.redirect('/admin');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
