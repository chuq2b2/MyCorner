export async function uploadMedia(
  file: File,
  mediaType: "audio" | "video",
  note?: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("media_type", mediaType);
  if (note) {
    formData.append("note", note);
  }

  try {
    const response = await fetch("/api/media/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
}

export async function listMedia(mediaType: "audio" | "video") {
  try {
    const response = await fetch(`/api/media/list/${mediaType}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${mediaType} files: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${mediaType} files:`, error);
    throw error;
  }
}
