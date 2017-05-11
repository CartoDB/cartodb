var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  initialize: function (opts) {
    this.template = opts.template;
    this.model = opts.model;
    this._initBinds();
  },

  render: function () {
    var html = this.template(this.model.attributes);

    this.clearSubViews();
    this.$el.empty();
    this.$el.append(html);
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:isDisabled', this.render);
  }
});
