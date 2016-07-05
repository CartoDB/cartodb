var Backbone = require('backbone');
var NodeDatasetItemView = require('./node-dataset-item-view');
var nodeDatasetSelectedTemplate = require('./node-dataset-selected.tpl');
var nodeDatasetItemTemplate = require('./node-dataset-item.tpl');

Backbone.Form.editors.NodeDataset = Backbone.Form.editors.Select.extend({

  options: {
    selectedItemTemplate: nodeDatasetSelectedTemplate,
    itemListTemplate: nodeDatasetItemTemplate,
    customListItemView: NodeDatasetItemView
  }

});
