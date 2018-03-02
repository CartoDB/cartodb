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
  'clearSQLModel'
];

module.exports = CoreView.extend({
  className: 'Dataset-options-actions',

  events: {
    'click .js-createMap': '_onCreateMap',
    'click .js-previewMap': '_onPreviewMap'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._applyButtonStatusModel = new Backbone.Model({
      loading: this._querySchemaModel.isFetching()
    });

    this._hasGeometry = true;
    this._renderIfHasGeometryChanges();
    this.listenTo(this._queryGeometryModel, 'change:status', this._renderIfHasGeometryChanges);
    this.listenTo(this._querySchemaModel, 'change:status', this._updateApplyLoadingButtonLoading);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        hasGeometry: this._hasGeometry,
        canCreateMap: true
      })
    );
    this._initViews();
    return this;
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
      onApplyClick: this._onApply.bind(this),
      onClearClick: this._onClear.bind(this)
    });

    this.$('.js-createMap').before(view.render().el);
    this.addView(view);
  },

  _onApply: function () {
    this._onApply && this._onApply();
  },

  _onClear: function () {
    this._onClear && this._onClear();
  },

  _onCreateMap: function () {
    this._mapAction && this._mapAction();
  },

  _onPreviewMap: function () {
    this._previewAction && this._previewAction();
  },

  _updateApplyLoadingButtonLoading: function () {
    this._applyButtonStatusModel.set('loading', this._querySchemaModel.isFetching());
  },

  _renderIfHasGeometryChanges: function () {
    var self = this;
    this._queryGeometryModel.hasValueAsync()
      .then(function (hasGeom) {
        if (hasGeom !== self._hasGeometry) {
          self._hasGeometry = hasGeom;
          self.render();
        }
      });
  }
});
