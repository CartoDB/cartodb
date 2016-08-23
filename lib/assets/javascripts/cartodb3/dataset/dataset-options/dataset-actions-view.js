var CoreView = require('backbone/core-view');
var _ = require('underscore');
var template = require('./dataset-actions.tpl');

var REQUIRED_OPTS = [
  'mapAction',
  'previewAction',
  'querySchemaModel'
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

    this._querySchemaModel.bind('change:status', this.render, this);
    this.add_related_model(this._querySchemaModel);
  },

  render: function () {
    this.clearSubViews();
    var geom = this._querySchemaModel.get('simple_geom');
    var geomWebmercator = this._querySchemaModel.columnsCollection.findWhere({ name: 'the_geom_webmercator' });
    this.$el.html(
      template({
        hasGeometry: geom && geomWebmercator
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
