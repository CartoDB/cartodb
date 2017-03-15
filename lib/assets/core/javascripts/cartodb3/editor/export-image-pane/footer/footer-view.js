var CoreView = require('backbone/core-view');
var template = require('./footer.tpl');

module.exports = CoreView.extend({
  className: 'Editor-FooterInfoEditor',

  events: {
    'click .js-ok': '_finish'
  },

  initialize: function (opts) {
    // if (!opts.createModel) throw new TypeError('createModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');
    if (!opts.configModel) throw new TypeError('configModel is required');

    // this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template);

    return this;
  },

  _finish: function (e) {
    this.killEvent(e);
    this.trigger('finish', this);
  }
});
