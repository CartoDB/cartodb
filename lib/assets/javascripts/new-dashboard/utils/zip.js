export function downloadAsZip (fileName, fileContent) {
  const blobURL = window.URL.createObjectURL(fileContent);

  if (navigator.msSaveOrOpenBlob) {
    return navigator.msSaveOrOpenBlob(fileContent, fileName);
  }

  const aLink = document.createElement('a');
  document.body.appendChild(aLink);
  aLink.style = 'display:none';
  aLink.href = blobURL;
  aLink.download = fileName;
  aLink.click();
  window.URL.revokeObjectURL(blobURL);
  aLink.remove();
}
