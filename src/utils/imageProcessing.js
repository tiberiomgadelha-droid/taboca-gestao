export const processarImagem = (file, callback) => {
  if(!file || !['image/jpeg','image/png','image/webp','image/jpg'].includes(file.type)) {
    alert('Formato inválido. Use JPG, PNG ou WebP.');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      let quality = 0.7;
      let base64 = canvas.toDataURL('image/jpeg', quality);
      while (base64.length > 150 * 1024 * 1.37 && quality > 0.2) {
        quality -= 0.1;
        base64 = canvas.toDataURL('image/jpeg', quality);
      }
      callback(base64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};
