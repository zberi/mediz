import { useState, useRef, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { useToast } from './use-toast';

export interface CapturedImage {
  base64: string;
  file: File;
}

export function useNativeCamera() {
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isNative = Capacitor.isNativePlatform();

  const base64ToFile = (base64: string, fileName: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
  };

  const captureWithNativeCamera = useCallback(async (): Promise<CapturedImage | null> => {
    try {
      setIsCapturing(true);
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        presentationStyle: 'fullscreen',
      });

      if (!photo.dataUrl) {
        throw new Error('No image data returned');
      }

      const file = base64ToFile(photo.dataUrl, `prescription-${Date.now()}.jpg`);
      return { base64: photo.dataUrl, file };
    } catch (error: any) {
      if (error?.message?.includes('cancel') || error?.message?.includes('User cancelled')) {
        return null;
      }
      console.error('Native camera error:', error);
      toast({
        title: 'Camera Error',
        description: error?.message || 'Failed to open camera',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  const pickFromNativeGallery = useCallback(async (): Promise<CapturedImage | null> => {
    try {
      setIsCapturing(true);
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        presentationStyle: 'fullscreen',
      });

      if (!photo.dataUrl) {
        throw new Error('No image data returned');
      }

      const file = base64ToFile(photo.dataUrl, `prescription-${Date.now()}.jpg`);
      return { base64: photo.dataUrl, file };
    } catch (error: any) {
      if (error?.message?.includes('cancel') || error?.message?.includes('User cancelled')) {
        return null;
      }
      console.error('Native gallery error:', error);
      toast({
        title: 'Gallery Error',
        description: error?.message || 'Failed to open gallery',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [toast]);

  const handleWebFileChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement>,
      onCapture: (image: CapturedImage) => void
    ): void => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        onCapture({ base64, file });
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [toast]
  );

  const capturePhoto = useCallback(async (
    onCapture: (image: CapturedImage) => void
  ): Promise<void> => {
    if (isNative) {
      const image = await captureWithNativeCamera();
      if (image) onCapture(image);
    } else {
      cameraInputRef.current?.click();
    }
  }, [isNative, captureWithNativeCamera]);

  const pickPhoto = useCallback(async (
    onCapture: (image: CapturedImage) => void
  ): Promise<void> => {
    if (isNative) {
      const image = await pickFromNativeGallery();
      if (image) onCapture(image);
    } else {
      fileInputRef.current?.click();
    }
  }, [isNative, pickFromNativeGallery]);

  return {
    isCapturing,
    isNative,
    fileInputRef,
    cameraInputRef,
    capturePhoto,
    pickPhoto,
    handleWebFileChange,
  };
}
