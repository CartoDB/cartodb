var _ = require('underscore');
var Backbone = require('backbone');
var template = require('./toggle.tpl');

Backbone.Form.editors.Toggle = Backbone.Form.editors.Radio.extend({
  className: 'Editor-formLabel CDB-Text CDB-Size-medium u-alignCenter',

  _arrayToHtml: function (array) {
    var name = this.getName();
    var id = this.id;

    var items = _.map(array, function (option, index) {
      var val = this.form.model.get(this.key);
      var item = {
        name: name,
        id: id + '-' + index
      };

      if (_.isObject(option)) {
        item.value = (option.val || option.val === 0) ? option.val : '';
        item.label = option.label;
        item.help = option.help;
        item.labelHTML = option.labelHTML;
        item.selected = (val !== void 0) ? val === option.val : option.selected;
      } else {
        item.value = option;
        item.label = option;
        item.selected = (val !== void 0) ? val === option : option.selected;
      }

      return item;
    }.bind(this));

    return template({ items: items });
  }
});
