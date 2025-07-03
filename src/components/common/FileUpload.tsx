import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle } from 'lucide-react';
import { useFileUpload } from '../../hooks/useFileUpload';

interface FileUploadProps {
  onUpload: (url: string) => void;
  bucket: string;
  path?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  bucket,
  path,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  className = '',
}) => {
  const { uploadFile, uploading, progress } = useFileUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        const result = await uploadFile(file, bucket, path);
        if (result.success && result.url) {
          onUpload(result.url);
        }
      }
    },
    [uploadFile, bucket, path, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
  });

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600 animate-pulse" />
              </div>
              <div className="w-full max-w-xs">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">Uploading... {progress}%</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop files here' : 'Upload files'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Max size: {Math.round(maxSize / (1024 * 1024))}MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name} className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">{file.name}</span>
              </div>
              <ul className="mt-1 text-xs text-red-600">
                {errors.map((error) => (
                  <li key={error.code}>• {error.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};