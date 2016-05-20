var cdb = require('cartodb.js');
var template = require('./analyses-workflow-item.tpl');

module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'HorizontalBlockList-item',

  events: {
    'click': '_onNodeClick'
  },

  initialize: function (opts) {
    if (!opts.nodeModel) throw new Error('nodeModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this.model = opts.nodeModel;
    this._analysisNode = opts.analysisNode;

    this._analysisNode.on('change:status', this.render, this);
    this.add_related_model(this._analysisNode);
  },

  render: function () {
    var status = this._analysisNode.get('status');
    var isDone = status === 'ready' || status === 'failed';
    var isSelected = !!this.options.selected;
    var bgColor = '#E27D61';

    this.$el.html(
      template({
        isDone: isDone,
        bgColor: bgColor,
        isSelected: isSelected,
        nodeId: this.model.get('id')
      })
    );

    this.$el.css({
      background: isSelected ? bgColor : '',
      border: isSelected ? '1px solid ' + bgColor : ''
    });
    this.$el.toggleClass('is-selected', isSelected);
    this.$el.toggleClass('has-error', status === 'failed');

    return this;
  },

  _onNodeClick: function () {
    this.trigger('nodeSelected', this.model, this);
  }
});
