var CoreView = require('backbone/core-view');
var template = require('./overlay.tpl');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.overlayModel) throw new Error('overlayModel is required');
    this.overlayModel = opts.overlayModel;
    this._initBinds();
  },

  render: function () {
    this.$el.empty();
    this.$el.append(template({
      visible: !this.overlayModel.get('visible') ? 'is-hidden' : ''
    }));
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.overlayModel, 'change:visible', this.render);
  }
});
