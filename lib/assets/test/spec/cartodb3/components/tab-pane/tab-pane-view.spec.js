var TabPaneView = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-collection');
var cdb = require('cartodb-deep-insights.js');

describe('components/tab-pane-view', function() {
  beforeEach(function() {
    this.collection = new TabPaneCollection();

    var model = new cdb.core.Model({
      createContentView: function() {
        return new cdb.core.View();
      },
      createButtonView: function() {
        return new cdb.core.View();
      }
    });

    this.collection.reset([model, model]);

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
