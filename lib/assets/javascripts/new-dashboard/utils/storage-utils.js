export function getExpBaseTwo (sizeInBytes) {
  if (sizeInBytes === 0) {
    return 0;
  }

  let exponent = 0;
  if (Math.log2) {
    exponent = Math.log2(sizeInBytes);
  } else {
    exponent = Math.log(sizeInBytes) * Math.LOG2E;
  }

  return Math.round(exponent / 10) * 10 - 10;
}

export function getUnit (sizeInBytes) {
  const exponent = getExpBaseTwo(sizeInBytes);
  if (exponent < 10) {
    return 'B';
  } else if (exponent < 20) {
    return 'KB';
  } else if (exponent < 30) {
    return 'MB';
  } else if (exponent < 40) {
    return 'GB';
  } else if (exponent < 50) {
    return 'TB';
  } else if (exponent < 60) {
    return 'PB';
  } else if (exponent < 70) {
    return 'EB';
  } else {
    return '?';
  }
}

export function getAmountInUnit (sizeInBytes, exponent) {
  const _exponent = (exponent || getExpBaseTwo(sizeInBytes));
  return sizeInBytes / Math.pow(2, _exponent);
}

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
