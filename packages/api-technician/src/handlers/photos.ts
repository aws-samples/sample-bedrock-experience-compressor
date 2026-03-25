import { Router } from 'express';
import { getUploadUrl, getPresignedUrl, BUCKETS } from '../services/s3.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/photos/upload-url - Generate presigned URL for photo upload
router.post('/upload-url', async (req: AuthRequest, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ error: 'fileName and fileType required' });
    }

    // Generate unique key: photos/{YYYY}/{MM}/{DD}/{timestamp}-{fileName}
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime();
    
    const key = `photos/${year}/${month}/${day}/${timestamp}-${fileName}`;

    // Generate presigned URL (5 minutes expiry)
    const uploadUrl = await getUploadUrl(BUCKETS.PHOTOS, key, fileType, 300);
    const photoUrl = `https://${BUCKETS.PHOTOS}.s3.amazonaws.com/${key}`;

    res.json({ uploadUrl, photoUrl });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// POST /api/photos/view-url - Generate presigned URL for viewing photo
router.post('/view-url', async (req: AuthRequest, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'photoUrl required' });
    }

    // Extract key from URL
    const key = photoUrl.split('.amazonaws.com/')[1] || photoUrl;

    // Generate presigned URL for viewing (1 hour expiry)
    const viewUrl = await getPresignedUrl(BUCKETS.PHOTOS, key, 3600);

    res.json({ viewUrl });
  } catch (error) {
    console.error('Error generating view URL:', error);
    res.status(500).json({ error: 'Failed to generate view URL' });
  }
});

export default router;
