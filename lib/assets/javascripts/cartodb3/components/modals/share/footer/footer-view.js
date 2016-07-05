var CoreView = require('backbone/core-view');
var template = require('./footer.tpl');

module.exports = CoreView.extend({
  className: 'Modal-actions',
  tagName: 'ul',

  events: {
    'click .js-done': '_onDoneClick',
    'click .js-update': '_onUpdateClick'
  },

  initialize: function (opts) {
    this._isUpdated = opts.isUpdated;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template({
      isUpdated: this._isUpdated
    }));
    return this;
  },

  _onDoneClick: function () {
    this.options.onDone && this.options.onDone();
  },

  _onUpdateClick: function () {
    this.options.onUpdate && this.options.onUpdate();
  }

});
