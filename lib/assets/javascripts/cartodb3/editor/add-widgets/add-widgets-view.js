var cdb = require('cartodb.js');
var template = require('./add-widgets.tpl');

/**
 * View to add new widgets.
 * Expected to be rendered in a modal
 */
module.exports = cdb.core.View.extend({
  className: 'Dialog-content Dialog-content--expanded',

  events: {
    'click .js-continue': '_onContinue'
  },

  initialize: function (opts) {
    if (!opts.modalModel) throw new Error('modalModel is required');
    this._modalModel = opts.modalModel;
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _onContinue: function () {
    var didConfirm = confirm('ORLY?'); // eslint-disable-line
    if (didConfirm) {
      this._modalModel.destroy();
    }
  }
});
