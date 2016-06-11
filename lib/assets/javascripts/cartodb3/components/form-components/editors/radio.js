var Backbone = require('backbone');
var template = require('./radio.tpl');
var _ = require('underscore');

Backbone.Form.editors.Radio = Backbone.Form.editors.Radio.extend({

  className: 'CDB-Text CDB-Size-medium u-iBlock',

  _arrayToHtml: function (array) {
    var selectedVal = this.form.model.get(this.key);

    var items = _.map(array, function (option, index) {
      var item = {
        name: this.getName(),
        value: (option.val || option.val === 0) ? option.val : '',
        id: this.id,
        label: option.label
      };

      // Can't be selected and disabled simultaneously
      if (selectedVal === option.val) {
        item.selected = true;
      } else {
        item.disabled = option.disabled;
      }

      return item;
    }, this);

    return template({
      items: items
    });
  }
});
