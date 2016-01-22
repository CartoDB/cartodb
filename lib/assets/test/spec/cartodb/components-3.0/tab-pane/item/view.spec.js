var TabPaneItemView = require('../../../../../../javascripts/cartodb/components-3.0/tab-pane/item/view');
var TabPaneModel = require('../../../../../../javascripts/cartodb/components-3.0/tab-pane/model');
var cdb = require('cartodb.js');
var _ = require('underscore');

describe('components-3.0/item/view', function() {
  beforeEach(function() {
    this.model = new TabPaneModel();

    this.view = new TabPaneItemView({
      model: this.model
    });
  });

  it('should have no leaks', function() {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  describe('render', function() {
    it('should render the icon', function() {
      this.model.set('icon', 'my-nice-icon');
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$el.find('i').length).toBe(1);
    });

    it('should render the view', function() {
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(1);
    });

    afterEach(function() {
      this.view.clean();
    });
  });

});
