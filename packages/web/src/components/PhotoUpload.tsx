import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { Button, Box, SpaceBetween } from '@cloudscape-design/components';
import { getIdToken } from '../services/auth';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

export default function PhotoUpload({ photos, onPhotosChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Compress image
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        // Get presigned URL
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/technician/photos/upload-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getIdToken()}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get upload URL: ${response.statusText}`);
        }

        const { uploadUrl, photoUrl } = await response.json();

        // Upload to S3
        await fetch(uploadUrl, {
          method: 'PUT',
          body: compressed,
          headers: { 'Content-Type': file.type },
        });

        uploadedUrls.push(photoUrl);
      }

      onPhotosChange([...photos, ...uploadedUrls]);
    } catch (error) {
      console.error('Failed to upload photos:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SpaceBetween size="s">
      <Box>
        <input
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="photo-upload"
        />
        <label htmlFor="photo-upload">
          <Button
            iconName="upload"
            loading={uploading}
            disabled={uploading}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('photo-upload')?.click();
            }}
          >
            {uploading ? 'Uploading...' : 'Add Photos'}
          </Button>
        </label>
      </Box>

      {photos.length > 0 && (
        <Box>
          <SpaceBetween size="xs">
            {photos.map((url, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <Box>Photo {index + 1}</Box>
                <Button
                  iconName="close"
                  variant="icon"
                  onClick={() => onPhotosChange(photos.filter((_, i) => i !== index))}
                />
              </div>
            ))}
          </SpaceBetween>
        </Box>
      )}
    </SpaceBetween>
  );
}
