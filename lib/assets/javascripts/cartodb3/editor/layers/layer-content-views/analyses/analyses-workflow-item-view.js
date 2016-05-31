var cdb = require('cartodb.js');
var template = require('./analyses-workflow-item.tpl');

module.exports = cdb.core.View.extend({

  tagName: 'li',
  className: 'HorizontalBlockList-item',

  events: {
    'click': '_onNodeClick'
  },

  initialize: function (opts) {
    if (!opts.analysisNode && !opts.formModel) throw new Error('analysisNode or formModel is required');
    if (!opts.viewModel) throw new Error('viewModel is required');

    this._isNew = !opts.analysisNode;
    this._analysisNode = opts.analysisNode || opts.formModel; // if form model represents a new node there is no analysis yet; use form model as fallback
    this._viewModel = opts.viewModel;

    this._analysisNode.on('change:status', this.render, this);
    this.add_related_model(this._analysisNode);
  },

  render: function () {
    var status = this._analysisNode.get('status');
    var isDone = this._isNew || status === 'ready' || status === 'failed';
    var isSelected = this._analysisNode.id === this._viewModel.get('selectedNodeId');
    var bgColor = '#E27D61';

    this.$el.html(
      template({
        isNew: this._isNew,
        isDone: isDone,
        bgColor: bgColor,
        isSelected: isSelected,
        nodeId: this._analysisNode.id
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
    this._viewModel.set('selectedNodeId', this._analysisNode.id);
  }
});
