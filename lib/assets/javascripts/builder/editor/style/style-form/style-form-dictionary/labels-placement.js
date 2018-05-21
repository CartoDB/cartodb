var _ = require('underscore');
var DialogConstants = require('builder/components/form-components/_constants/_dialogs');

module.exports = {
  generate: function () {
    var PLACEMENTS = ['point', 'line', 'vertex', 'interior'];

    return {
      type: 'Select',
      title: _t('editor.style.components.labels-placement.label'),
      dialogMode: DialogConstants.Mode.FLOAT,
      options: _.reduce(PLACEMENTS, function (values, type) {
        values.push({
          val: type,
          label: _t('editor.style.components.labels-placement.options.' + type)
        });

        return values;
      }, []),
      editorAttrs: {
        showSearch: false
      }
    };
  }
};
