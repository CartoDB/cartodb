var TabPaneView = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/view');
var TabPaneCollection = require('../../../../../javascripts/cartodb/components-3.0/tab-pane/collection');
var cdb = require('cartodb.js');

describe('components-3.0/view', function() {
  beforeEach(function() {
    this.collection = new TabPaneCollection();

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
    expect(this.$el.find('.js-menu').length).toBe(1);
  });

  afterEach(function() {
    this.view.clean();
  });
});
