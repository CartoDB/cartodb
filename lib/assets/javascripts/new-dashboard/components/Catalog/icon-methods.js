export default {
  getCSSModifier (option) {
    return this.replaceAll(option, ' ', '-').toLowerCase();
  },
  replaceAll (str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
  }
};
