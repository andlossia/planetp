const { Storage } = require('@google-cloud/storage');
const dotenv = require('dotenv');

dotenv.config();

// Validate necessary environment variables
if (!process.env.KEYFILENAME || !process.env.BUCKET_NAME) {
    throw new Error('Environment variables KEYFILENAME and BUCKET_NAME must be set');
}

// Parse the base64-encoded private key
let credentials;
try {
    credentials = JSON.parse(Buffer.from(process.env.KEYFILENAME, 'base64').toString('utf8'));
} catch (error) {
    throw new Error('Error parsing the credentials from KEYFILENAME');
}

// Initialize Google Cloud Storage
const videoStorage = new Storage({
    projectId: credentials.project_id,
    credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
    },
});

const cloudBucket = videoStorage.bucket(process.env.BUCKET_NAME);

// Generate signed URL for a given file name
const generateSignedUrl = async (fileName) => {
    // Validate fileName
    if (!fileName) {
        throw new Error('File name must be provided');
    }

    const options = {
        version: 'v4',
        action: 'read', // Access type: 'read', 'write', or 'delete'
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };

    try {
        // Generate the signed URL
        const [url] = await cloudBucket.file(fileName).getSignedUrl(options);
        return url;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw new Error('Failed to generate signed URL');
    }
};

module.exports = { cloudBucket, generateSignedUrl };
