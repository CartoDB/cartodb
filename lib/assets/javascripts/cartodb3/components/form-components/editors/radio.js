var Backbone = require('backbone');
var template = require('./radio.tpl');
var _ = require('underscore');

Backbone.Form.editors.Radio = Backbone.Form.editors.Radio.extend({

  className: 'CDB-Text CDB-Size-medium u-iBlock',

  _arrayToHtml: function (array) {
    var items = _.map(array, function (option, index) {
      return {
        name: this.getName(),
        value: (option.val || option.val === 0) ? option.val : '',
        id: this.id,
        label: option.label
      };
    }, this);

    return template({ items: items });
  }
});
