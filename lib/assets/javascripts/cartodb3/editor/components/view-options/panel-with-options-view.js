var cdb = require('cartodb.js');
var template = require('./panel-with-options.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.createContentView) throw new Error('createContentView factory function is mandatory');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this._createContentView = opts.createContentView;
    this._editorModel = opts.editorModel;
    this._createControlView = opts.createControlView;
    this._createActionView = opts.createActionView;

    this._editorModel.on('change:edition', this._changeStyle, this);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    var contentView;
    var controlView;
    var actionView;

    this.clearSubViews();
    this.$el.empty();

    this.$el.html(template());

    contentView = this._createContentView();

    this._content().html(contentView.render().el);
    this.addView(contentView);

    if (this._createControlView) {
      controlView = this._createControlView();
      this._controls().html(controlView.render().el);
      this.addView(controlView);
    }

    if (this._createActionView) {
      actionView = this._createActionView();
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
  },

  changeStyleMenu: function (m) {
    this.$('.js-theme').toggleClass('is-dark', m.isEditing());
  }
});
