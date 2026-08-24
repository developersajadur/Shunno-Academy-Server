import multer from 'multer';
import { IStorageProvider, StorageFile, UploadResult } from './storage.interface';
import { CloudinaryStorageProvider } from './cloudinary.provider';

export class StorageService {
  private provider: IStorageProvider;

  constructor(provider: IStorageProvider) {
    this.provider = provider;
  }

  /**
   * Switch the storage provider at runtime if needed
   */
  public setProvider(provider: IStorageProvider) {
    this.provider = provider;
  }

  public async upload(file: Express.Multer.File, folder?: string): Promise<UploadResult> {
    const storageFile: StorageFile = {
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
    return this.provider.uploadFile(storageFile, folder);
  }

  public async delete(publicId: string): Promise<boolean> {
    return this.provider.deleteFile(publicId);
  }
}

// Multer memory storage configuration for file parsing
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image, video, and PDF files are allowed!'));
    }
  },
});

// Default active storage provider is Cloudinary (easily swapped to S3StorageProvider or others)
export const storageService = new StorageService(new CloudinaryStorageProvider());

export default storageService;

