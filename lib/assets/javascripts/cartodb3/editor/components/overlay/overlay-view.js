var cdb = require('cartodb.js');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.overlayModel) throw new Error('overlayModel is required');
    this.overlayModel = opts.overlayModel;
    this._initBinds();
  },

  render: function () {
    var self = this;
    var visible = !self.overlayModel.get('wait') ? 'none' : 'block';

    this.$el.css({
      display: visible,
      position: 'absolute',
      background: 'rgba(255, 255, 255, 0.6)',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 100
    });

    return this;
  },

  _initBinds: function () {
    this.listenTo(this.overlayModel, 'change:wait', this._toggle);
    this.add_related_model(this.overlayModel);
  },

  _toggle: function () {
    var visible = this.overlayModel.get('wait');
    this.$el.toggle(visible);
  }
});
