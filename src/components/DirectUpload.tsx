'use client';
 
import { upload } from '@vercel/blob/client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface DirectUploadProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

export default function DirectUpload({ onUploadComplete, className = '' }: DirectUploadProps) {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
 
  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    
    const file = inputFileRef.current?.files?.[0];
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    // Check file size (warning for large files, but allow them)
    if (file.size > 20 * 1024 * 1024) { // 20MB warning
      toast.error('File too large. Maximum size is 20MB');
      return;
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
 
    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });
 
      toast.success('Image uploaded successfully!');
      onUploadComplete(newBlob.url);
      
      // Reset file input
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = () => {
    inputFileRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={inputFileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />
      
      {/* Upload button */}
      <button
        type="button"
        onClick={handleFileSelect}
        disabled={isUploading}
        className="btn-gold w-full py-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-cream border-t-transparent rounded-full animate-spin"></div>
            <span>Uploading... {uploadProgress.toFixed(0)}%</span>
          </div>
        ) : (
          <span>📸 Choose Image</span>
        )}
      </button>
      
      {/* Progress bar */}
      {isUploading && (
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gold transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      
      {/* File info */}
      {inputFileRef.current?.files?.[0] && !isUploading && (
        <div className="text-cream/60 text-sm">
          <p>Selected: {inputFileRef.current.files[0].name}</p>
          <p>Size: {(inputFileRef.current.files[0].size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
      
      {/* Help text */}
      <div className="text-cream/35 text-xs">
        <p>• Supported formats: JPEG, PNG, WebP, GIF</p>
        <p>• Maximum file size: 20MB</p>
        <p>• Images are uploaded directly to cloud storage</p>
      </div>
    </div>
  );
}
