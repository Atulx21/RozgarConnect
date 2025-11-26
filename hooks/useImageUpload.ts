import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

type UploadResult = {
  paths: string[];
  publicUrls: string[];
};

export async function uploadEquipmentImages(imageUris: string[], userId: string): Promise<UploadResult> {
  const paths: string[] = [];

  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];

    // Read local file as base64 to avoid blob/fetch issues on RN
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);

    // Try to infer extension from URI; default to jpg
    const uriLower = uri.toLowerCase();
    const ext =
      uriLower.endsWith('.png') ? 'png' :
      uriLower.endsWith('.webp') ? 'webp' :
      uriLower.endsWith('.jpg') || uriLower.endsWith('.jpeg') ? 'jpg' :
      'jpg';

    const contentType =
      ext === 'png' ? 'image/png' :
      ext === 'webp' ? 'image/webp' :
      'image/jpeg';

    const fileName = `${userId}/${Date.now()}_${i}.${ext}`;

    const { error } = await supabase.storage
      .from('equipment')
      .upload(fileName, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    paths.push(fileName);
  }

  const publicUrls = paths.map((p) => {
    const { data } = supabase.storage.from('equipment').getPublicUrl(p);
    return data.publicUrl;
  });

  return { paths, publicUrls };
}