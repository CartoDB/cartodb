var TabPaneContentView = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-content-view');
var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');

describe('components/tab-pane-content-view', function() {
  beforeEach(function() {
    this.model = new cdb.core.Model({
      createContentView: function() {
        return new cdb.core.View();
      }
    });

    this.view = new TabPaneContentView({
      model: this.model
    });
  });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the view', function() {
    this.view.render();
    expect(_.size(this.view._subviews)).toBe(1);
  });

  afterEach(function() {
    this.view.clean();
  });
});
