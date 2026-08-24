import { v2 as cloudinary } from 'cloudinary';
import { IStorageProvider, StorageFile, UploadResult } from './storage.interface';
import config from '../../config';

export class CloudinaryStorageProvider implements IStorageProvider {
  readonly name = 'cloudinary' as const;

  constructor() {
    cloudinary.config({
      cloud_name: config.cloudinary.cloud_name,
      api_key: config.cloudinary.api_key,
      api_secret: config.cloudinary.api_secret,
    });
  }

  async uploadFile(file: StorageFile, folder = config.cloudinary.folder): Promise<UploadResult> {
    if (!config.cloudinary.cloud_name || config.cloudinary.cloud_name === 'demo') {
      const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return {
        url: base64,
        publicId: `local-${Date.now()}`,
        provider: 'cloudinary',
        bytes: file.size,
        format: file.mimetype.split('/')[1] || 'png',
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error || !result) {
            // If Cloudinary fails, fallback to base64 so user flow is uninterrupted
            const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            return resolve({
              url: base64,
              publicId: `fallback-${Date.now()}`,
              provider: 'cloudinary',
              bytes: file.size,
              format: file.mimetype.split('/')[1] || 'png',
            });
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            provider: 'cloudinary',
            bytes: result.bytes,
            format: result.format,
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const res = await cloudinary.uploader.destroy(publicId);
      return res.result === 'ok';
    } catch {
      return false;
    }
  }
}

