var CoreView = require('backbone/core-view');
var _ = require('underscore');
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

    this._hasGeometry = true;
    this._renderIfHasGeometryChanges();
    this.listenTo(this._queryGeometryModel, 'change:status', this._renderIfHasGeometryChanges);
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      template({
        hasGeometry: this._hasGeometry,
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
