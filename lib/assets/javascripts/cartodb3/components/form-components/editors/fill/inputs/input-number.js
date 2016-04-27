var cdb = require('cartodb.js');
var template = require('./input-number.tpl');
var InputDialogContent = require('./input-number-dialog-content.js');

module.exports = cdb.core.View.extend({
  className: 'Fill-inputNumber',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    this._value = opts.value;
    this.model = new cdb.core.Model({
      createContentView: function () {
        return new InputDialogContent();
      }
    });
  },

  _onClick: function (e) {
    this.trigger('click', this.model.get('createContentView'));
  },

  render: function () {
    this.$el.html(template({
      value: this._value
    }));
    return this;
  }
});
