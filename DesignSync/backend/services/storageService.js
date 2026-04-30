const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/zip',
  'application/octet-stream'
];

const hasCloudinaryConfig = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const getExtension = (mimetype, originalName = '') => {
  const originalExt = path.extname(originalName);
  if (originalExt) return originalExt;

  const extensions = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
  };

  return extensions[mimetype] || '.bin';
};

const uploadToLocalStorage = async (buffer, mimetype, originalName) => {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  await fs.promises.mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${getExtension(mimetype, originalName)}`;
  const targetPath = path.join(uploadDir, filename);
  await fs.promises.writeFile(targetPath, buffer);

  const baseUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
  return {
    url: `${baseUrl}/uploads/${filename}`,
    publicId: filename
  };
};

exports.uploadToCloudinary = (buffer, mimetype, folder = 'designsync', originalName = '') => {
  return new Promise((resolve, reject) => {
    if (!allowedMimeTypes.includes(mimetype)) {
      return reject(new ApiError(400, 'File type not allowed'));
    }

    if (!hasCloudinaryConfig()) {
      uploadToLocalStorage(buffer, mimetype, originalName).then(resolve).catch((error) => {
        reject(new ApiError(500, 'Failed to save upload locally: ' + error.message));
      });
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: folder, resource_type: 'auto' },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, 'Failed to upload to Cloudinary: ' + error.message));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    uploadStream.end(buffer);
  });
};
