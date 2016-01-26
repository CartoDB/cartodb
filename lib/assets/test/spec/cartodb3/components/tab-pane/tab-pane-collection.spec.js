var TabPaneCollection = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-collection');
var cdb = require('cartodb.js');

describe('components/tab-pane-collection', function() {
  beforeEach(function() {
    this.collection = new TabPaneCollection();
    this.collection.reset([new cdb.core.Model(), new cdb.core.Model()]);
  });

  it('should select one item by default', function() {
    var isSelected = this.collection.find(function(model) {
      return model.get('selected');
    });
    expect(isSelected).toBe(this.collection.at(0));
  });

});
