var cdb = require('cartodb.js');
var _ = require('underscore');
var template = require('./panel-with-options.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.createContentView) {
      throw new Error('createContentView factory function is mandatory');
    }

    this.options = _.extend({}, opts);
  },

  render: function () {
    var contentView;
    var controlView;
    var actionView;

    this.$el.append(template());

    contentView = this.options.createContentView();
    this._content().html(contentView.render().el);
    this.addView(contentView);

    if (this.options.createControlView) {
      controlView = this.options.createControlView();
      this._controls().html(controlView.render().el);
      this.addView(controlView);
    }

    if (this.options.createActionView) {
      actionView = this.options.createActionView();
      this._actions().html(actionView.render().el);
      this.addView(actionView);
    }

    return this;
  },

  _content: function () {
    return this.$('.js-content');
  },

  _controls: function () {
    return this.$('.js-controls');
  },

  _actions: function () {
    return this.$('.js-actions');
  }
});
