var TabPaneModel = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/model');
var TabPaneCollection = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/collection');
var cdb = require('cartodb.js');

describe('components-3.0/collection', function() {
  beforeEach(function() {
    this.collection = new TabPaneCollection();
    this.collection.reset([new TabPaneModel(), new TabPaneModel()]);
  });

  fit('should select one item by default', function() {
    var isSelected = this.collection.find(function(model) {
      return model.get('selected');
    });
    expect(isSelected).toBe(this.collection.at(0));
  });

});
