const { Readable, pipeline } = require('stream');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const Media = require('../models/mediaModel');
const { getBucket } = require('../database');

dotenv.config();

const credentials = JSON.parse(Buffer.from(process.env.KEYFILENAME, 'base64').toString('utf8'));

const videoStorage = new Storage({
  projectId: credentials.project_id,
  credentials: {
    client_email: credentials.client_email,
    private_key: credentials.private_key,
  },
});


const cloudBucket = videoStorage.bucket(process.env.BUCKET_NAME);

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

const mediaTypeMap = Object.entries(mediaExtensions).reduce((acc, [type, exts]) => {
  exts.forEach(ext => acc[ext] = type);
  return acc;
}, {});

const getMediaType = (ext) => mediaTypeMap[ext] || 'unknown';


const getMimeType = (mediaType) => mimeTypes[mediaType] || 'application/octet-stream';

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
  limits: { fileSize: 10 * 1024 * 1024 * 1024 },
  fileFilter,
});

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

const processFileUpload = async (file, body, user) => {
  const { mimetype, buffer, originalname } = file;
  const ext = path.extname(originalname).toLowerCase();
  const mediaType = getMediaType(ext);
  const owner = user ? user.id : null;

  // Function to upload to Google Cloud Storage as a fallback
  const uploadToGoogleCloud = async (buffer, originalname, mimetype) => {
    const gcsFileName = `media/${mediaType}s/${Date.now()}-${encodeURIComponent(originalname)}`;
    const mediaBlob = cloudBucket.file(gcsFileName);
    const mediaStreamUpload = mediaBlob.createWriteStream({
      metadata: {
        contentType: mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      pipeline(
        Readable.from(buffer),
        mediaStreamUpload,
        (err) => {
          if (err) {
            console.error('Error uploading file to GCS:', err);
            reject(new Error('Error uploading file.'));
          } else {
            resolve(`https://storage.googleapis.com/${process.env.BUCKET_NAME}/${gcsFileName}`);
          }
        }
      );
    });
  };

  if (mediaType === 'video') {
    // Send video directly to Google Cloud Storage
    try {
      const googleCloudUrl = await uploadToGoogleCloud(buffer, originalname, mimetype);
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
    // For non-video files, try uploading to MongoDB first
    try {
      const uploadStream = getBucket().openUploadStream(originalname, {
        contentType: mimetype,
        metadata: { mediaType },
      });

      await new Promise((resolve, reject) => {
        pipeline(
          Readable.from(buffer),
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

      // Save media data in MongoDB
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
      console.error('MongoDB failed, falling back to Google Cloud Storage:', error);

      // Fallback: Upload to Google Cloud Storage if MongoDB fails
      const googleCloudUrl = await uploadToGoogleCloud(buffer, originalname, mimetype);
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

const dynamicUpload = (req, res, next) => {
  const fieldName = req.body.fieldName || 'file';
  const multerUpload = upload.single(fieldName);

  multerUpload(req, res, async (err) => {
    if (err) {
      console.error('Error in dynamicUpload middleware:', err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
      return;
    }

    try {
      if (req.file) {
        const mediaId = await processFileUpload(req.file, req.body, req.user);
        req.media = await Media.findById(mediaId);
        res.status(201).json({ message: 'File uploaded successfully', media: req.media });
      } else if (req.body.url) {
        const mediaId = await createOrUpdateMedia(req.body);
        req.media = await Media.findById(mediaId);
        res.status(201).json({ message: 'File data updated successfully', media: req.media });
      } else {
        next();
      }
    } catch (error) {
      console.error('Error in dynamicUpload middleware:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
};

module.exports = { upload, mediaExtensions, dynamicUpload, getMediaType, getMimeType };