var TabPaneItem = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/item/view');
var TabPaneModel = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/model');
var cdb = require('cartodb.js');

describe('components-3.0/model', function() {
  beforeEach(function() {
    this.itemView = new TabPaneItem();
    this.model = new TabPaneModel({ itemView: this.itemView });
  });

  fit('should listen to button clicked event', function() {
    this.itemView.trigger('buttonClicked');
    expect(this.model.get('selected')).toBeTruthy();
  });

});
