var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var template = require('./dataset-actions.tpl');
var UndoButtons = require('builder/components/undo-redo/undo-redo-view');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'mapAction',
  'previewAction',
  'trackModel',
  'editorModel',
  'queryGeometryModel',
  'querySchemaModel',
  'onApply',
  'onClear',
  'clearSQLModel',
  'applyButtonStatusModel'
];

module.exports = CoreView.extend({
  className: 'Dataset-options-actions',

  events: {
    'click .js-createMap': '_onCreateMap',
    'click .js-previewMap': '_onPreviewMap'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initViewState();
    this.listenTo(this._queryGeometryModel, 'change:status', this._setViewState);
    this.listenTo(this._querySchemaModel, 'change:status', this._updateApplyLoadingButtonLoading);
    this.listenTo(this._viewState, 'change', this.render);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        hasGeometry: this._viewState.get('hasGeom'),
        canCreateMap: true
      })
    );
    this._initViews();
    return this;
  },

  _initViewState: function () {
    this._viewState = new Backbone.Model({
      hasGeom: true
    });
    this._setViewState();
  },

  _initViews: function () {
    var view = new UndoButtons({
      className: 'u-rSpace--xl',
      trackModel: this._trackModel,
      editorModel: this._editorModel,
      clearModel: this._clearSQLModel,
      applyStatusModel: this._applyButtonStatusModel,
      applyButton: true,
      clearButton: true,
      onApplyClick: this._handleApply.bind(this),
      onClearClick: this._handleClear.bind(this)
    });

    this.$('.js-createMap').before(view.render().el);
    this.addView(view);
  },

  _handleApply: function () {
    if (this._onApply) { this._onApply(); }
  },

  _handleClear: function () {
    if (this._onClear) { this._onClear(); }
  },

  _onCreateMap: function () {
    if (this._mapAction) { this._mapAction(); }
  },

  _onPreviewMap: function () {
    if (this._previewAction) { this._previewAction(); }
  },

  _updateApplyLoadingButtonLoading: function () {
    this._applyButtonStatusModel.set('loading', this._querySchemaModel.isFetching());
  },

  _setViewState: function () {
    var self = this;
    this._queryGeometryModel.hasValueAsync()
      .then(function (hasGeom) {
        self._viewState.set('hasGeom', hasGeom);
      });
  }
});
