"use server";

import { supabaseAdmin } from "@/lib/supabase";

/**
 * Server action to handle generic file uploads to the 'images' bucket.
 * Expects FormData with 'file' (the File object) and 'folder' (string path).
 */
export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "misc";

    if (!file) {
      return { error: "No file provided" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate a unique filename and construct the dynamic path
    const customName = formData.get("name") as string | null;
    const fileExtension = file.name.split(".").pop() || "png";
    const fileName = customName ?? `${crypto.randomUUID()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage 'images' bucket using the Admin Client
    const { data, error } = await supabaseAdmin.storage
      .from("images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase Upload Error:", error);
      return { error: `Failed to upload to Supabase: ${error.message}` };
    }

    // Get the Public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("images").getPublicUrl(data.path);

    return { success: true, url: publicUrl, path: data.path };
  } catch (err) {
    console.error("Upload Action Error:", err);
    return { error: "Internal server error during upload" };
  }
}

/**
 * Extracts the file path from a Supabase public URL and deletes it from the 'images' bucket.
 */
export async function deleteFileFromUrl(url: string | null | undefined) {
  if (!url) return;

  try {
    const bucketString = "/storage/v1/object/public/images/";
    if (url.includes(bucketString)) {
      const path = url.split(bucketString)[1];
      if (path) {
        const { error } = await supabaseAdmin.storage
          .from("images")
          .remove([path]);
        if (error) {
          console.error("Failed to delete file:", error);
        }
      }
    }
  } catch (e) {
    console.error("Unexpected error deleting file from URL:", e);
  }
}

/**
 * Wrapper for uploadFile that first deletes an existing file to prevent orphaned images.
 * Expects FormData with 'file', 'folder', and 'oldUrl' (the public URL of the file to replace).
 */
export async function replaceFile(formData: FormData) {
  const oldUrl = formData.get("oldUrl") as string | null;
  await deleteFileFromUrl(oldUrl);

  // Proceed with uploading the new file
  return await uploadFile(formData);
}
