const getImageUrl = (filename) => {
  if (!filename) {
    return null;
  }
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL;
  return `${baseUrl}${filename}`;
};

export { getImageUrl };
