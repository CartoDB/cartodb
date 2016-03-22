var cdb = require('cartodb-deep-insights.js');
var template = require('./analyses-workflow-item.tpl');

module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'HorizontalBlockList-item',

  events: {
    'click': '_onNodeClick'
  },

  initialize: function (opts) {
    if (!opts.nodeModel) throw new Error('Node model is required');
    this.model = opts.nodeModel;
  },

  render: function () {
    this.$el.html(
      template({
        nodeId: this.model.get('id')
      })
    );
    this.$el.toggleClass('is-selected', !!this.options.selected);
    return this;
  },

  _onNodeClick: function () {
    this.trigger('nodeSelected', this.model, this);
  }
});
