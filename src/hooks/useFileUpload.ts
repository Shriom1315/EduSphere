import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import toast from 'react-hot-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (
    file: File,
    bucket: string,
    path?: string
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      // Note: Firebase Storage uses a single default bucket.
      // The 'bucket' parameter is not directly used in the same way as Supabase.
      // Files are organized by path within the default bucket.

      setUploading(true);
      setProgress(0);

      const storage = getStorage();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;
      const storageRef = ref(storage, filePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
          },
          (error) => {
            // Handle unsuccessful uploads
            console.error('Upload failed:', error);
            toast.error(error.message || 'Failed to upload file');
            setUploading(false);
            setProgress(0);
            reject({ success: false, error: error.message });
          },
          () => {
            // Handle successful uploads on complete
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              toast.success('File uploaded successfully!');
              setUploading(false);
              setProgress(0);
              resolve({ success: true, url: downloadURL });
            }).catch((error) => {
               console.error('Failed to get download URL:', error);
               toast.error(error.message || 'Failed to get download URL');
               setUploading(false);
               setProgress(0);
               reject({ success: false, error: error.message });
            });
          }
        );
      });

    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file');
      return { success: false, error: error.message };
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const deleteFile = async (
    bucket: string,
    path: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, path);

      // Note: Firebase Storage uses a single default bucket.
      // The 'bucket' parameter is not directly used here.
      await deleteObject(fileRef);

      toast.success('File deleted successfully!');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file');
      return { success: false, error: error.message };
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
  };
};