import { Router } from 'express';
import { UploadController } from './upload.controller';
import { upload } from '../../services/storage';
import auth from '../../middlewares/auth';
import { uploadLimiter } from '../../middlewares/rateLimiter';

const router = Router();

/**
 * @openapi
 * /upload:
 *   post:
 *     summary: Upload an image or document (Cloudinary / Decoupled Storage Provider)
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 example: 'shunno-academy/receipts'
 *     responses:
 *       200:
 *         description: File uploaded and secure URL returned
 */
router.post('/', uploadLimiter, auth(), upload.single('file'), UploadController.uploadSingle);

/**
 * @openapi
 * /upload/delete:
 *   post:
 *     summary: Delete a file by public ID
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [publicId]
 *             properties:
 *               publicId: { type: string }
 *     responses:
 *       200:
 *         description: File deleted
 */
router.post('/delete', auth(), UploadController.deleteFile);

export const uploadRoutes = router;
export default uploadRoutes;

