var CoreView = require('backbone/core-view');
var template = require('./analysis-buttons.tpl');

module.exports = CoreView.extend({
  className: 'u-flex u-justifySpace',

  initialize: function (opts) {
    this.template = template;
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
    this.listenTo(this.model, 'change:disableDelete', this.render);
    // listenTo drops events if view is removed from DOM
    this.model.on('change:isDone', this.render, this);
  }
});
