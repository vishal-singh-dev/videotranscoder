const express = require('express');
const multer = require('multer');
const { transcodeHandler } = require('./transcode.js');
const cors=require('cors');
// Create an instance of express
const app = express();
app.use(cors());
// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Transcode endpoint
app.post('/transcode', upload.single('video'), transcodeHandler);

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
