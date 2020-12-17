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

/* eslint-disable no-tabs */
// PROPOSAL	
/*	
  const STORAGE_UNITS = {	
    B: Math.pow(10, 3 - 1),
    KB: Math.pow(10, 6 - 1),
    MB: Math.pow(10, 9 - 1),
    GB: Math.pow(10, 12 - 1),
    TB: Math.pow(10, 15 - 1),
    PB: Math.pow(10, 18 - 1),	
    EB: Math.pow(10, 21 - 1),
    ZB: Math.pow(10, 24 - 1),
    YB: Math.pow(10, 27 - 1)
  };	
  	
  export function getUnit (sizeInBytes) {	
    // const exponent = getExpBaseTwo(sizeInBytes);	
    console.log(sizeInBytes);	
    const unitIndex = Object.values(STORAGE_UNITS).findIndex((threshold, index) => {	
      return sizeInBytes < threshold;	
    });	
    console.log(unitIndex ? sizeInBytes / (Object.values(STORAGE_UNITS)[unitIndex - 1] * 10) : sizeInBytes, Object.keys(STORAGE_UNITS)[unitIndex]);	
  }	
*/
