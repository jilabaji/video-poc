import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import HandBrake from 'handbrake-js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'client/dist')));

// Configure multer for video upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// Create uploads directory if it doesn't exist
try {
  await fs.access('./uploads');
} catch {
  await fs.mkdir('./uploads');
}

// API Routes
app.post('/api/optimize', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { method = 'ffmpeg' } = req.body;
    const inputPath = req.file.path;
    const outputPath = `uploads/optimized-${req.file.filename}`;

    const originalStats = await fs.stat(inputPath);

    if (method === 'handbrake') {
      await new Promise((resolve, reject) => {
        HandBrake.spawn({
          input: inputPath,
          output: outputPath,
          preset: 'Very Fast 1080p30'
        })
        .on('error', reject)
        .on('complete', resolve);
      });
    } else {
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-c:v libx264',
            '-crf 23',
            '-preset medium',
            '-c:a aac',
            '-b:a 128k'
          ])
          .output(outputPath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    }

    const optimizedStats = await fs.stat(outputPath);

    const result = {
      originalSize: originalStats.size,
      optimizedSize: optimizedStats.size,
      originalUrl: `/videos/${path.basename(inputPath)}`,
      optimizedUrl: `/videos/${path.basename(outputPath)}`,
      reduction: ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(2)
    };

    // Schedule cleanup after 1 hour
    setTimeout(async () => {
      try {
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }, 3600000);

    res.json(result);

  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: 'Error processing video' });
  }
});

// Serve uploaded videos
app.use('/videos', express.static('uploads'));

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});