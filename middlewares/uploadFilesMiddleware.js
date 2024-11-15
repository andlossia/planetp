const { Readable, pipeline } = require('stream');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const Media = require('../models/mediaModel');
const { getBucket } = require('../database');

dotenv.config();

// Google Cloud credentials and configuration
const parseGoogleCloudCredentials = () => {
  try {
    const credentials = JSON.parse(Buffer.from(process.env.KEYFILENAME, 'base64').toString('utf8'));
    return {
      projectId: credentials.project_id,
      clientEmail: credentials.client_email,
      privateKey: credentials.private_key,
    };
  } catch (err) {
    throw new Error('Invalid or missing Google Cloud credentials.');
  }
};

const googleCloudCredentials = parseGoogleCloudCredentials();
const videoStorage = new Storage({
  projectId: googleCloudCredentials.projectId,
  credentials: {
    client_email: googleCloudCredentials.clientEmail,
    private_key: googleCloudCredentials.privateKey,
  },
});

const cloudBucket = videoStorage.bucket(process.env.BUCKET_NAME);

// Media type definitions
const mediaExtensions = {
  image: ['.png', '.jpg', '.gif', '.jpeg', '.bmp', '.svg', '.webp'],
  video: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'],
  audio: ['.mp3', '.wav', '.ogg', '.wma', '.aac', '.flac', '.alac'],
  file: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'],
};

const mimeTypes = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/x-msvideo', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  file: ['application/pdf', 'application/msword', 'application/vnd.ms-excel'],
};

const mediaTypeMap = Object.entries(mediaExtensions).reduce((acc, [type, extensions]) => {
  extensions.forEach((ext) => {
    acc[ext] = type;
  });
  return acc;
}, {});

const getMediaType = (ext) => mediaTypeMap[ext] || 'unknown';
const isValidExtension = (ext) => !!mediaTypeMap[ext];
const isValidMimeType = (mimetype, mediaType) => mimeTypes[mediaType]?.includes(mimetype);

// Multer configuration for in-memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mediaType = getMediaType(ext);
  if (isValidExtension(ext) && isValidMimeType(file.mimetype, mediaType)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type or MIME type.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 10GB limit
  fileFilter,
});

// Helper: Create or update media in MongoDB
const createOrUpdateMedia = async (mediaData) => {
  const existingMedia = await Media.findOne({ url: mediaData.url });
  if (existingMedia) {
    await Media.updateOne({ _id: existingMedia._id }, mediaData);
    return existingMedia._id;
  }
  const newMedia = new Media(mediaData);
  await newMedia.save();
  return newMedia._id;
};

// Helper: Upload to Google Cloud Storage
const uploadToGoogleCloud = async (fileStream, originalname, mimetype) => {
  const gcsFileName = `media/videos/${Date.now()}-${encodeURIComponent(originalname)}`;
  const mediaBlob = cloudBucket.file(gcsFileName);

  return new Promise((resolve, reject) => {
    const mediaStreamUpload = mediaBlob.createWriteStream({
      metadata: { contentType: mimetype },
      resumable: true,
    });

    fileStream
      .pipe(mediaStreamUpload)
      .on('error', (err) => {
        console.error('Error uploading to Google Cloud:', err);
        reject(new Error('Failed to upload to Google Cloud.'));
      })
      .on('finish', () => {
        const publicUrl = `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${gcsFileName}`;
        resolve(publicUrl);
      });
  });
};

// Main function to process file uploads
const processFileUpload = async (file, body, user) => {
  const { mimetype, buffer, originalname } = file;
  const ext = path.extname(originalname).toLowerCase();
  const mediaType = getMediaType(ext);
  const owner = user?.id;

  try {
    const fileStream = Readable.from(buffer);
    const googleCloudUrl = await uploadToGoogleCloud(fileStream, originalname, mimetype);
    const mediaData = {
      fileName: body.fileName || originalname,
      altText: body.altText || '',
      slug: `${mediaType}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      url: googleCloudUrl,
      owner,
      mediaType,
    };

    const mediaId = await createOrUpdateMedia(mediaData);
    return mediaId;
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw new Error('File upload failed.');
  }
};

// Middleware to handle uploads dynamically
const dynamicUpload = (req, res, next) => {
  const fieldName = req.body.fieldName || 'file';
  const multerUpload = upload.single(fieldName);

  multerUpload(req, res, async (err) => {
    if (err) {
      console.error('Error during file upload:', err);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }

    try {
      if (req.file) {
        const mediaId = await processFileUpload(req.file, req.body, req.user);
        req.media = await Media.findById(mediaId);
        return res.status(201).json({ message: 'File uploaded successfully', media: req.media });
      }
      next();
    } catch (error) {
      console.error('Error processing upload:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
};

module.exports = {
  upload,
  dynamicUpload,
  mediaExtensions,
  getMediaType,
  isValidExtension,
  isValidMimeType,
};
