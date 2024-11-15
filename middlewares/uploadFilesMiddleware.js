const { Readable, pipeline } = require('stream');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const Media = require('../models/mediaModel');
const { getBucket } = require('../database');

dotenv.config();

// Parse Google Cloud credentials from environment variables
const credentials = JSON.parse(Buffer.from(process.env.KEYFILENAME, 'base64').toString('utf8'));

// Google Cloud Storage initialization
const videoStorage = new Storage({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});

const cloudBucket = videoStorage.bucket(process.env.BUCKET_NAME);

// Supported media types and extensions
const mediaExtensions = {
  image: ['.png', '.jpg', '.gif', '.jpeg', '.bmp', '.svg', '.webp'],
  video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'],
  audio: ['.mp3', '.wav', '.ogg', '.wma', '.aac', '.flac', '.alac'],
  file: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'],
};

const mimeTypes = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/mpeg',
  file: 'application/octet-stream',
};

// Map extensions to media types
const mediaTypeMap = Object.entries(mediaExtensions).reduce((acc, [type, exts]) => {
  exts.forEach(ext => acc[ext] = type);
  return acc;
}, {});

const getMediaType = (ext) => mediaTypeMap[ext] || 'unknown';
const getMimeType = (mediaType) => mimeTypes[mediaType] || 'application/octet-stream';

// Multer configuration for in-memory storage
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (Object.values(mediaExtensions).flat().includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type.'));
  }
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB limit
  fileFilter,
});

// Helper to create or update media in MongoDB
const createOrUpdateMedia = async (mediaData) => {
  const existingMedia = await Media.findOne({ url: mediaData.url });

  if (existingMedia) {
    await Media.updateOne({ _id: existingMedia._id }, mediaData);
    return existingMedia._id;
  } else {
    const newMedia = new Media(mediaData);
    await newMedia.save();
    return newMedia._id;
  }
};

// Function to upload a file to Google Cloud Storage
const uploadToGoogleCloud = async (file, originalname, mimetype) => {
  const gcsFileName = `media/videos/${Date.now()}-${encodeURIComponent(originalname)}`;
  const mediaBlob = cloudBucket.file(gcsFileName);
  
  const mediaStreamUpload = mediaBlob.createWriteStream({
    metadata: {
      contentType: mimetype,
    },
    resumable: true, // Enable resumable uploads for large files
  });

  return new Promise((resolve, reject) => {
    file.stream.pipe(mediaStreamUpload)
      .on('error', (err) => {
        console.error('Error uploading to Google Cloud:', err);
        reject(new Error('Failed to upload video.'));
      })
      .on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${gcsFileName}`;
        resolve(publicUrl);
      });
  });
};


// Main function to process file uploads
const processFileUpload = async (file, body, user) => {
  const { mimetype, buffer, originalname } = file; // Use buffer directly from multer
  const ext = path.extname(originalname).toLowerCase();
  const mediaType = getMediaType(ext);
  const owner = user ? user.id : null;

  if (mediaType === 'video') {
    try {
      // Convert buffer to a readable stream
      const fileStream = Readable.from(buffer);
      const googleCloudUrl = await uploadToGoogleCloud(fileStream, originalname, mimetype);
      const videoData = {
        fileName: body.fileName || originalname,
        altText: body.altText || '',
        slug: `video-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        url: googleCloudUrl,
        owner,
        mediaType,
      };

      const mediaId = await createOrUpdateMedia(videoData);
      return mediaId;
    } catch (error) {
      console.error('Failed to upload video to Google Cloud:', error);
      throw new Error('Failed to upload video.');
    }
  } else {
    try {
      const uploadStream = getBucket().openUploadStream(originalname, {
        contentType: mimetype,
        metadata: { mediaType },
      });

      await new Promise((resolve, reject) => {
        pipeline(
          Readable.from(buffer), // Convert buffer to a stream
          uploadStream,
          (err) => {
            if (err) {
              console.error('Error uploading file to MongoDB:', err);
              reject(new Error('Error uploading file.'));
            } else {
              resolve();
            }
          }
        );
      });

      const mediaData = {
        fileName: body.fileName || originalname,
        altText: body.altText || '',
        slug: `${mediaType}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        url: `/uploads/${mediaType}/${originalname}`,
        owner,
        mediaType,
      };

      const mediaId = await createOrUpdateMedia(mediaData);
      return mediaId;
    } catch (error) {
      console.error('Error uploading file to MongoDB, falling back to Google Cloud Storage:', error);

      const fileStream = Readable.from(buffer); // Convert buffer to stream for fallback
      const googleCloudUrl = await uploadToGoogleCloud(fileStream, originalname, mimetype);
      const fallbackMediaData = {
        fileName: body.fileName || originalname,
        altText: body.altText || '',
        slug: `${mediaType}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        url: googleCloudUrl,
        owner,
        mediaType,
      };

      try {
        const mediaId = await createOrUpdateMedia(fallbackMediaData);
        return mediaId;
      } catch (fallbackError) {
        console.error('Failed to save Google Cloud URL in MongoDB:', fallbackError);
        throw new Error('Failed to upload media to both MongoDB and Google Cloud Storage.');
      }
    }
  }
};

// Middleware to dynamically handle uploads
const dynamicUpload = (req, res, next) => {
  const fieldName = req.body.fieldName || 'file';
  const multerUpload = upload.single(fieldName);

  multerUpload(req, res, async (err) => {
    if (err) {
      console.error('Error in dynamicUpload middleware:', err);
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }

    try {
      if (req.file) {
        const googleCloudUrl = await uploadToGoogleCloud(req.file, req.file.originalname, req.file.mimetype);
        res.status(201).json({ message: 'File uploaded successfully', url: googleCloudUrl });
      } else {
        next();
      }
    } catch (uploadError) {
      console.error('Upload process failed:', uploadError);
      res.status(500).json({ message: 'Internal server error', error: uploadError.message });
    }
  });
};


module.exports = { upload, mediaExtensions, dynamicUpload, getMediaType, getMimeType };
