var TabPaneView = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-collection');
var cdb = require('cartodb.js');

describe('components/tab-pane-view', function() {
  beforeEach(function() {
    this.collection = new TabPaneCollection();

    this.collection.reset([new cdb.core.Model(), new cdb.core.Model()]);

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
