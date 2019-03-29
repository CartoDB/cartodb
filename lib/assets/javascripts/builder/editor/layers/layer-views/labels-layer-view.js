var CoreView = require('backbone/core-view');
var template = require('./image-thumbnail-layer.tpl');

module.exports = CoreView.extend({
  module: 'editor:layers:layer-views:labels-layer-view',

  tagName: 'li',

  className: 'BlockList-item BlockList-item--noAction js-layer ui-state-disabled',

  initialize: function (opts) {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    var desc = _t('editor.layers.labels.title-label');
    var title = this.model.getName() || desc;

    this.$el.html(template({
      title: title,
      desc: title === desc ? '' : desc,
      imgURL: this._getImageURL()
    }));

    return this;
  },

  _getImageURL: function () {
    return this.model.get('urlTemplate')
      .replace('{s}', 'a')
      .replace('{z}', 6)
      .replace('{x}', 30)
      .replace('{y}', 24);
  }
});
