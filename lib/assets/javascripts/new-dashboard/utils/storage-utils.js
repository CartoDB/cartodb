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
