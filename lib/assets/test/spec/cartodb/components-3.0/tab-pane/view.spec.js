var TabPaneView = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/view');
var TabPaneModel = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/model');
var TabPaneCollection = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/collection');
var cdb = require('cartodb.js');

describe('components-3.0/view', function() {
  beforeEach(function() {
    this.collection = new TabPaneCollection();

    var tabItemModel = new TabPaneModel();

    this.collection.add(tabItemModel);

    this.view = new TabPaneView({
      collection: this.collection
    });
  });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  it('should render', function() {
    this.view.render();
    expect(this.view.$el.find('.js-menu').length).toBe(1);
    expect(this.view.$el.find('.js-content').length).toBe(1);
  });

  afterEach(function() {
    this.view.clean();
  });
});
