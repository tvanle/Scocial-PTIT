import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { ERROR_MESSAGES } from '../shared/constants';

// Memory storage for processing before saving
const memoryStorage = multer.memoryStorage();

// Disk storage for direct file saving
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(ERROR_MESSAGES.FILE_TYPE_NOT_ALLOWED));
  }
};

// Memory upload (for image processing)
export const uploadMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter,
});

// Disk upload (direct save)
export const uploadDisk = multer({
  storage: diskStorage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter,
});

// Export specific configurations
export const uploadSingle = uploadMemory.single('file');
export const uploadMultiple = uploadMemory.array('files', 10);
export const uploadFields = uploadMemory.fields([
  { name: 'images', maxCount: 10 },
  { name: 'video', maxCount: 1 },
]);
