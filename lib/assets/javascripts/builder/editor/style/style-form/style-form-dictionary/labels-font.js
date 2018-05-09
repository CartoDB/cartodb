var FONTS_LIST = [
  'DejaVu Sans Book',
  'Unifont Medium',
  'Open Sans Regular',
  'Lato Regular',
  'Lato Bold',
  'Lato Bold Italic',
  'Graduate Regular',
  'Gravitas One Regular',
  'Old Standard TT Regular',
  'Old Standard TT Italic',
  'Old Standard TT Bold'
];

module.exports = {
  generate: function () {
    return {
      type: 'Select',
      dialogMode: 'float',
      options: FONTS_LIST
    };
  }
};
