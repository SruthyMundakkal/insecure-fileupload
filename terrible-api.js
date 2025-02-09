// server setup
const express = require('express');

const path = require('path');
const multer = require('multer');

// storage stuff
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

const app = express();

// Setup middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// user credentials stored in plain text (vulnerability)
const users = {
  'bob': { password: '123', email: 'bob@email.com', role: 'user' },
  'john': { password: '456', email: 'john@email.com', role: 'admin' },
  'bruce': { password: 'imbatman', email: 'bruce@email.com', role: 'batman' }
};

// user data stored insecurely (vulnerability)
const userSecrets = {
  'bob': ["Bob's secret #1", "Hates John the admin."],
  'john': ["John's secret #1", "John's secret #2"],
  'bruce': ['Is actually batman.']
};

// Declare a global variable to store the uploaded file's path.
let uploadedFilePath = '';

// ==============================================
// Insecure Endpoints for Vulnerability Demonstration
// ==============================================

// 1. Basic Login Endpoint (vulnerable: no password check, plain-text credentials)
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Insecure App Demo</title>
      <style>
        body { padding: 20px; font-family: Arial; }
        .section { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
      </style>
    </head>
    <body>
      <h1>Insecure App Demo</h1>
      <form action="/" method="post">
        <input type="text" id="username" name="username" placeholder="Username">
        <input type="text" id="password" name="password" placeholder="Password">
        <button type="submit">Login</button>
      </form>
    </body>
    </html>
  `);
});

// 1. Login without hiding password
app.post('/', (req, res) => {
  const { username, password } = req.body;
  if (users[username] && users[username].password === password) {
    email = users[username].email;
    if (users[username].role === 'admin') {
      return res.redirect('/admin');
    }
    res.redirect(`/welcome?username=${username}&email=${email}`);
  } else if (!users[username]) {
    res.send(`<h1>User "${username}" does not exist</h1>`);
  } else {
    res.send('<h1>Username and password do not match</h1>');
  }
});

app.get('/welcome', (req, res) => {
  const username = req.query.username;

  if (!users[username]) {
    return res.send(`<h1>User "${username}" does not exist</h1>`);
  }

  const role = users[username].role;
  if (role === 'admin') {
    return res.redirect('/admin');
  }
  res.send(`
    <h1>Welcome, ${username}!</h1>
    <p>Your secrets: </p>
    <ul>
      ${userSecrets[username].map(secret => `<li>${secret}</li>`).join('')}
    </ul>
  `);
});

// 2. Missing Access Control: An unprotected admin endpoint
app.get('/admin', (req, res) => {
  // Vulnerable: No authentication or authorization checks!
  let output = `<h1>Admin Panel</h1>`;
  for (const username in users) {
    output += `<h2>User: ${username}</h2>`;
    output += `<p>Email: ${users[username].email}</p>`;
    output += `<p>Role: ${users[username].role}</p>`;
    output += `<p>Secrets: <ul>${userSecrets[username].map(secret => `<li>${secret}</li>`).join('')}</ul></p>`;
  }
  res.send(output);
});

// 3. Insecure File Upload: No file type or content validation
app.get('/upload', (req, res) => {
  res.send(`
    <h1>File Upload</h1>
    <form action="/upload" method="post" enctype="multipart/form-data">
      <input type="file" name="file">
      <button type="submit">Upload File</button>
    </form>
    <p>Note: There is no validation on the file type or content. This is insecure!</p>
  `);
});

app.post('/upload', upload.single('file'), (req, res) => {
// Vulnerable: The uploaded file is accepted without any checks.
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }
  uploadedFilePath = `/uploads/${req.file.filename}`;
  res.send(`<h1>File uploaded successfully!</h1><p>File is now available in the <a href="/directory">directory</a></p>`);
});

app.get('/directory', (req, res) => {
  res.send(`
    <h1>File Directory</h1>
    <ul>
      <li><a href="/">Winds of Winter Leaked Draft</a></li>
      <li><a href="/">Cool Winamp Visualizations</a></li>
      <li><a href="/hl3">Half-Life 3 ISO Full Game Leak</a></li>
      <li><a href="/">VST Bundle with keygen (not from Russia)</a></li>
    </ul>
  `);
});

// 4. Insecure File Access: Directly serving uploaded files
app.get('/hl3', (req, res) => {
  res.send(`
    <h1>Half-Life 3 Leaked ISO</h1>
    <p>Download Half-Life 3 ISO here:</p> 
    <a href="${uploadedFilePath}"><img src="/uploads/download-now.png" alt="Download Now"></a>
    <p>Download your copy of <a href="https://www.daemon-tools.cc/products/dtLite"><strong>daemon tools</strong</p></a>
  `);
});

// ==============================================
// Start the insecure demo app
// ==============================================
app.listen(3000, () => {
  console.log('Insecure demo app running on http://localhost:3000');
});