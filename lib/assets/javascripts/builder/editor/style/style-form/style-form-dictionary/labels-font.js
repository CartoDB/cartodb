var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

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
      dialogMode: DialogConstants.Mode.FLOAT,
      options: FONTS_LIST
    };
  }
};
