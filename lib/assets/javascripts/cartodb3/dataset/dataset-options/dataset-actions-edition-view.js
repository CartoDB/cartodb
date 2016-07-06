var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./dataset-actions.tpl');
var UndoButtons = require('../../components/undo-redo/undo-redo-view');

var REQUIRED_OPTS = [
  'mapAction',
  'previewAction',
  'trackModel',
  'editorModel',
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
    _.each(REQUIRED_OPTS, function (item) {
      if (!opts[item]) throw new Error(item + ' is required');
      this['_' + item] = opts[item];
    }, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(template());
    this._initViews();
    return this;
  },

  _initViews: function () {
    var view = new UndoButtons({
      className: 'u-rSpace--xl',
      trackModel: this._trackModel,
      editorModel: this._editorModel,
      clearModel: this._clearSQLModel,
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
  }
});
