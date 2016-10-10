var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./dataset-actions.tpl');

// 'mapAction' is not required  because a viewer user can't create maps
var OPTS = {
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
    _.each(OPTS, function (isRequired, item) {
      if(opts[item]) {
        this['_' + item] = opts[item];
      } else if (isRequired) {
        throw new Error(item + ' is required');
      }
    }, this);

    this._queryGeometryModel.bind('change:status', this.render, this);
    this.add_related_model(this._queryGeometryModel);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        hasGeometry: this._queryGeometryModel.hasValue(),
        canCreateMap: !!this._mapAction
      })
    );
    return this;
  },

  _onPreviewMap: function () {
    this._previewAction && this._previewAction();
  },

  _onCreateMap: function () {
    this._mapAction && this._mapAction();
  }
});
