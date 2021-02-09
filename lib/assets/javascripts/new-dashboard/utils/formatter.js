export function humanFileSize (size) {
  if (size === 0) {
    return '0 B';
  }
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return `${(size / Math.pow(1024, i)).toFixed(2) * 1} ${['B', 'kB', 'MB', 'GB', 'TB'][i]}`;
}

export function numberFormatter (size) {
  if (size < 1000) {
    return size;
  }
  const i = Math.floor(Math.log(size) / Math.log(1000));
  return `${(size / Math.pow(1000, i)).toFixed(2) * 1}${['k', 'M', 'G'][i - 1]}`;
}
