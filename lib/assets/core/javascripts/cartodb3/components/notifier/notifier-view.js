var CoreView = require('backbone/core-view');
var _ = require('underscore');
var NotifierItemView = require('./notifier-item-view');
var template = require('./notifier.tpl');

module.exports = CoreView.extend({
  className: 'Notifier',

  initialize: function (opts) {
    if (!opts.collection) throw new Error('collection is mandatory');
    if (!opts.editorModel) throw new Error('editorModel is mandatory');

    this._editorModel = opts.editorModel;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._renderAllSubviews();
    this._renderLoading();
    return this;
  },

  rebindEvents: function () {
    // Just in case
    this.stopListening(this.collection);
    this.stopListening(this._editorModel);
    this._initBinds();
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.collection, 'reset update change:status', this.render);
    this.add_related_model(this.collection);

    this.listenTo(this._editorModel, 'change:edition', this._changeStyle);
    this.add_related_model(this._editorModel);
  },

  _renderAllSubviews: function () {
    this.collection.each(this._renderSubview, this);
  },

  _renderSubview: function (model) {
    var view = new NotifierItemView({
      notifierModel: model,
      editorModel: this._editorModel
    });

    var status = model.get('status');
    var container = (status === 'success' || status === 'error')
      ? this._getDoneContainer()
      : this._getLoadingContainer();
    container.append(view.render().el);
    this.addView(view);
  },

  _removeSubview: function (model) {
    var id = model.get('id');
    var view = _.first(_.filter(this._subviews, function (subview) {
      return subview._notifierModel.get('id') === id;
    }));

    if (view) {
      this.removeView(view);
      view.remove();
    }
  },

  _renderLoading: function () {
    this._getLoader().toggleClass('is-visible', this._anyNotificationLoading());
  },

  _anyNotificationLoading: function () {
    return this.collection.any(function (model) {
      return !_.contains(['success', 'error', 'warning'], model.get('status'));
    });
  },

  _changeStyle: function () {
    this.$el.toggleClass('is-dark', this._editorModel.isEditing());
  },

  _getDoneContainer: function () {
    return this.$('.js-status-done');
  },

  _getLoadingContainer: function () {
    return this.$('.js-status-loading');
  },

  _getLoader: function () {
    return this.$('.js-loader');
  }
});
