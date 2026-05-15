/**
 * Cloudinary Image Upload Integration
 * Cloud Name: damyyxhet
 * Listing Preset: regent_listings_preset
 * Profile Preset: regent_profiles_preset
 */

const CLOUDINARY_CONFIG = {
  cloud: 'damyyxhet',
  listingPreset: 'regent_listings_preset',
  profilePreset: 'regent_profiles_preset'
};

export const uploadListingImage = async (file) => {
  if (!file) throw new Error('No file selected');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.listingPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Listing image upload error:', error);
    throw error;
  }
};

export const uploadProfileImage = async (file) => {
  if (!file) throw new Error('No file selected');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.profilePreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Profile image upload error:', error);
    throw error;
  }
};

