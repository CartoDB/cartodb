var cdb = require('cartodb.js');
var template = require('./input-color.tpl');
var InputDialogContent = require('./input-color-dialog-content.js');

module.exports = cdb.core.View.extend({
  className: 'Fill-inputColor',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    var self = this;
    this.model = new cdb.core.Model(opts);
    this.model.set('createContentView', function () {
      return self._createContentView();
    }).bind(this);
    this.model.on('change', this.render, this);
  },

  _createContentView: function () {
    return new InputDialogContent({
      model: this.model
    });
  },

  _onClick: function (e) {
    this.trigger('click', this.model.get('createContentView'));
  },

  render: function () {
    this.$el.html(template({
      value: this.model.get('fixed')
    }));
    return this;
  }
});
