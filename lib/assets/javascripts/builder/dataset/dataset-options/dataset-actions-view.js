var CoreView = require('backbone/core-view');
var _ = require('underscore');
var Backbone = require('backbone');
var template = require('./dataset-actions.tpl');

// 'mapAction' is not required  because a viewer user can't create maps
var REQUIRED_OPTS = {
  previewAction: true,
  queryGeometryModel: true,
  mapAction: false
};

module.exports = CoreView.extend({
  className: 'Dataset-options-actions',

  events: {
    'click .js-createMap': '_onCreateMap',
    'click .js-previewMap': '_onPreviewMap'
  },

  initialize: function (opts) {
    _.each(REQUIRED_OPTS, function (isRequired, item) {
      if (opts[item]) {
        this['_' + item] = opts[item];
      } else if (isRequired) {
        throw new Error(item + ' is required');
      }
    }, this);

    this._initViewState();
    this.listenTo(this._queryGeometryModel, 'change:status', this._setViewState);
    this.listenTo(this._viewState, 'change', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        hasGeometry: this._viewState.get('hasGeometry'),
        canCreateMap: !!this._mapAction
      })
    );
    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      hasGeometry: true
    });
    this._setViewState();
  },

  _onPreviewMap: function () {
    this._previewAction && this._previewAction();
  },

  _onCreateMap: function () {
    this._mapAction && this._mapAction();
  },

  _setViewState: function () {
    this._queryGeometryModel.hasValueAsync()
      .then(function (hasGeom) {
        this._viewState.set('hasGeometry', hasGeom);
      }.bind(this))
      .catch(function () {
        this._viewState.set('hasGeometry', false);
      }.bind(this));
  }
});
