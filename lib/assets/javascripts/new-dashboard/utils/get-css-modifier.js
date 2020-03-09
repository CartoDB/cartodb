import replaceAll from './replace-all';

const getCSSModifier = function getCSSModifier (option) {
  return replaceAll(option, ' ', '-').toLowerCase();
};

export default getCSSModifier;
