var CoreView = require('backbone/core-view');
var template = require('./panel-with-options.tpl');
var InfoboxView = require('builder/components/infobox/infobox-view');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.createContentView) throw new Error('createContentView factory function is mandatory');
    if (!opts.editorModel) throw new Error('editorModel is required');

    this.template = this.options.template || template;

    this._createContentView = opts.createContentView;
    this._editorModel = opts.editorModel;
    this._createControlView = opts.createControlView;
    this._createActionView = opts.createActionView;
    this._infoboxModel = opts.infoboxModel;
    this._infoboxCollection = opts.infoboxCollection;

    this._editorModel.on('change:edition', this._setStyleMenu, this);
    this.add_related_model(this._editorModel);
  },

  render: function () {
    var contentView;
    var controlView;
    var actionView;
    var infoboxView;

    this.clearSubViews();
    this.$el.empty();

    this.$el.html(this.template());

    contentView = this._createContentView();

    this._content().html(contentView.render().el);
    this.addView(contentView);

    if (this._infoboxModel) {
      infoboxView = new InfoboxView({
        infoboxModel: this._infoboxModel,
        infoboxCollection: this._infoboxCollection
      });

      this._info().html(infoboxView.render().el);
      this.addView(infoboxView);
    }

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

    this._setStyleMenu();

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

  _info: function () {
    return this.$('.js-info');
  },

  _setStyleMenu: function () {
    this.$('.js-theme').toggleClass('is-dark', this._editorModel.isEditing());
  }
});
