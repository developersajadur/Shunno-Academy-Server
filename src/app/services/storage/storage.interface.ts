export interface StorageFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export interface UploadResult {
  url: string;
  publicId: string;
  provider: 'cloudinary' | 's3' | 'gcs' | 'local';
  bytes?: number;
  format?: string;
}

export interface IStorageProvider {
  readonly name: 'cloudinary' | 's3' | 'gcs' | 'local';
  uploadFile(file: StorageFile, folder?: string): Promise<UploadResult>;
  deleteFile(publicId: string): Promise<boolean>;
}

