import multer from 'multer';
import { config } from '../config';
import { ERROR_MESSAGES } from '../constants';

const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED));
    }
  },
});

// Specific upload configurations
export const uploadSingle = uploadMiddleware.single('file');
export const uploadMultiple = uploadMiddleware.array('files', config.upload.maxFiles);
