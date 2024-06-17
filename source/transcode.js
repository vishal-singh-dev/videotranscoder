const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const { promisify } = require('util');

// Promisify the unlink function for better async handling
const unlinkAsync = promisify(fs.unlink);
await ffmpeg.load();
// Function to transcode video to a specific resolution
const transcodeVideo = (inputPath, outputPath, size) => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .size(size)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

// Function to handle the transcoding process
const transcodeHandler = async (req, res) => {
  const inputPath = req.file.path;
  const resolutions = {
    '360p': { path: `uploads/output-360p-${Date.now()}.mp4`, size: '640x360' },
    '480p': { path: `uploads/output-480p-${Date.now()}.mp4`, size: '854x480' },
    '720p': { path: `uploads/output-720p-${Date.now()}.mp4`, size: '1280x720' },
  };

  try {
    // Transcode to multiple resolutions
    const transcodePromises = Object.keys(resolutions).map((key) => {
      const { path, size } = resolutions[key];
      return transcodeVideo(inputPath, path, size);
    });

    // Wait for all transcodings to complete
    await Promise.all(transcodePromises);

    // Send response with links to download the transcoded files
    res.json({
      message: 'Transcoding completed',
      files: Object.fromEntries(Object.entries(resolutions).map(([key, { path }]) => [key, path])),
    });

    // Clean up the original uploaded file
    await unlinkAsync(inputPath);
  } catch (error) {
    console.error('Error during transcoding:', error);
    res.status(500).send('Error during transcoding');
    
    // Clean up the original uploaded file and any partially transcoded files
    await unlinkAsync(inputPath);
    await Promise.all(Object.values(resolutions).map(({ path }) => unlinkAsync(path).catch(() => {})));
  }
};

module.exports = {
  transcodeHandler
};
