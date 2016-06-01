var Backbone = require('backbone');
var template = require('./radio.tpl');
var _ = require('underscore');

Backbone.Form.editors.Radio = Backbone.Form.editors.Radio.extend({

  className: 'CDB-Text CDB-Size-medium u-iBlock',

  _arrayToHtml: function (array) {
    var selectedVal = this.form.model.get(this.key);
    var disabled = !!(this.schema.editorAttrs && this.schema.editorAttrs.disabled);

    var items = _.map(array, function (option, index) {
      var item = {
        name: this.getName(),
        value: (option.val || option.val === 0) ? option.val : '',
        id: this.id,
        label: option.label
      };

      // only when disabled and matches selectedVal, otherwise it's done dynamically through model's attrs
      if (disabled && selectedVal === option.val) {
        item.selected = true;
      }

      return item;
    }, this);

    return template({
      items: items,
      disabled: disabled
    });
  }
});
