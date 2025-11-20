import { supabase } from '@/lib/supabase';

type UploadResult = {
  paths: string[];
  publicUrls: string[];
};

export async function uploadEquipmentImages(imageUris: string[], userId: string): Promise<UploadResult> {
  const paths: string[] = [];

  for (let i = 0; i < imageUris.length; i++) {
    const uri = imageUris[i];
    // Try to fetch blob from the URI (supported in Expo)
    const resp = await fetch(uri);
    const blob = await resp.blob();

    const ext = blob.type?.split('/')[1] || 'jpg';
    const fileName = `${userId}/${Date.now()}_${i}.${ext}`;

    const { error } = await supabase.storage
      .from('equipment')
      .upload(fileName, blob, {
        contentType: blob.type || 'image/jpeg',
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