const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

// Storage setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// User credentials stored in plain text (vulnerable)
const users = {
  'user': { password: 'user123', email: 'bob@email.com', role: 'user' },
  'admin': { password: 'admin123', email: 'john@email.com', role: 'admin' },
};

// 1. Basic Login Endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Insecure App Demo</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 py-10">
      <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Login</h1>
        <form action="/" method="post">
          <input type="text" id="username" name="username" placeholder="Username" class="w-full p-3 mb-4 border border-gray-300 rounded"/>
          <input type="password" id="password" name="password" placeholder="Password" class="w-full p-3 mb-4 border border-gray-300 rounded"/>
          <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded">Login</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 1. Login POST request to authenticate users
app.post('/', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    return res.redirect('/upload');
  } else if (!users[username]) {
    res.send(`<h1>User "${username}" does not exist</h1>`);
  } else {
    res.send('<h1>Username and password do not match</h1>');
  }
});

// 2. Insecure File Upload Endpoint
app.get('/upload', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>File Upload</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 py-10">
      <div class="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">File Upload</h1>
        <form action="/upload" method="post" enctype="multipart/form-data">
          <input type="file" name="file" class="w-full p-3 mb-4 border border-gray-300 rounded"/>
          <button type="submit" class="w-full bg-blue-500 text-white py-3 rounded">Upload File</button>
        </form>
        <p class="text-sm text-gray-600">Note: No validation on file type or content (insecure).</p>
      </div>
    </body>
    </html>
  `);
});

// Handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  res.send(`<h1>File uploaded successfully!</h1><p>File is now available in the <a href="/directory">directory</a></p>`);
});

// 2. Display uploaded files dynamically from the directory
app.get('/directory', (req, res) => {
  const uploadDir = path.join(__dirname, 'uploads');

  // Read all files in the uploads directory
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }

    // Generate HTML to list files
    let fileList = files.map(file => {
      const filePath = `/uploads/${file}`;
      return `<li><a href="${filePath}" class="text-blue-500 hover:underline">${file}</a></li>`;
    }).join('');

    // Send HTML with dynamic file list
    res.send(`
      <html>
      <head>
        <title>File Directory</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-100 py-10">
        <div class="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Uploaded Files</h1>
          <ul class="space-y-2">
            ${fileList}
          </ul>
        </div>
      </body>
      </html>
    `);
  });
});

// Start the insecure demo app
app.listen(3000, () => {
  console.log('Insecure demo app running on http://localhost:3000');
});
