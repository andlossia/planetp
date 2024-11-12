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

  // Check if the media type is a video
  if (mediaType === 'video') {
    // Upload to Google Cloud Storage
    const gcsFileName = `videos/${Date.now()}-${encodeURIComponent(originalname)}`;
    const videoBlob = cloudBucket.file(gcsFileName);
    const videoStreamUpload = videoBlob.createWriteStream({
      metadata: {
        contentType: mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      pipeline(
        Readable.from(buffer),
        videoStreamUpload,
        async (err) => {
          if (err) {
            console.error('Error uploading video to GCS:', err);
            reject(new Error('Error uploading video.'));
          } else {
            try {
              const mediaData = {
                fileName: body.fileName || originalname,
                altText: body.altText || '',
                slug: `video-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                url: `https://storage.googleapis.com/${process.env.BUCKET_NAME}/${gcsFileName}`,
                owner,
                mediaType,
              };
              const mediaId = await createOrUpdateMedia(mediaData);
              resolve(mediaId);
            } catch (err) {
              console.error('Error saving media to MongoDB:', err);
              reject(new Error('Error saving media.'));
            }
          }
        }
      );
    });
  } else {
    // Upload non-video files to MongoDB (GridFS or similar)
    const uploadStream = getBucket().openUploadStream(originalname, {
      contentType: mimetype,
      metadata: { mediaType },
    });

    return new Promise((resolve, reject) => {
      pipeline(
        Readable.from(buffer),
        uploadStream,
        async (err) => {
          if (err) {
            console.error('Error uploading file:', err);
            reject(new Error('Error uploading file.'));
          } else {
            try {
              const mediaData = {
                fileName: body.fileName || originalname,
                altText: body.altText || '',
                slug: `${mediaType}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                url: `/uploads/${mediaType}/${originalname}`,
                owner,
                mediaType,
              };
              const mediaId = await createOrUpdateMedia(mediaData);
              resolve(mediaId);
            } catch (err) {
              console.error('Error saving media:', err);
              reject(new Error('Error saving media.'));
            }
          }
        }
      );
    });
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
        req.media = await Media.findById(mediaId); // Retrieve media to attach to request
      } else if (Object.keys(req.body).length > 0 && req.body.url) {
        const mediaId = await createOrUpdateMedia(req.body);
        req.media = await Media.findById(mediaId); // Retrieve media to attach to request
      } else {
      }

      next();
    } catch (error) {
      console.error('Error in dynamicUpload middleware:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
};

module.exports = { upload, mediaExtensions, dynamicUpload, getMediaType, getMimeType };