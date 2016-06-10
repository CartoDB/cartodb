var CoreView = require('backbone/core-view');
var template = require('./labels-layer.tpl');

/**
 * View for labels layers
 */
module.exports = CoreView.extend({

  tagName: 'li',

  className: 'BlockList-item BlockList-item--noAction js-layer ui-state-disabled',

  initialize: function (opts) {
    this.listenTo(this.model, 'change', this.render);
  },

  render: function () {
    var desc = _t('editor.layers.labels.title-label');
    var title = this.model.getName() || desc;

    var imgURL = this.model.get('urlTemplate')
      .replace('{s}', 'a')
      .replace('{z}', 6)
      .replace('{x}', 30)
      .replace('{y}', 24);

    this.$el.html(template({
      title: title,
      desc: title === desc ? '' : desc,
      imgURL: imgURL
    }));

    return this;
  }
});
