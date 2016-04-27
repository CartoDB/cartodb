var TabPaneView = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('../../../../../javascripts/cartodb3/components/tab-pane/tab-pane-collection');
var cdb = require('cartodb.js');
var _ = require('underscore');

describe('components/tab-pane-view', function () {
  beforeEach(function () {
    this.collection = new TabPaneCollection();

    var model = new cdb.core.Model({
      createContentView: function () {
        return new cdb.core.View();
      },
      createButtonView: function () {
        return new cdb.core.View();
      }
    });

    var model2 = new cdb.core.Model({
      createContentView: function () {
        return new cdb.core.View();
      },
      createButtonView: function () {
        return new cdb.core.View();
      }
    });

    this.collection.reset([model, model2]);

    this.view = new TabPaneView({
      collection: this.collection
    });
  });

  it('should have no leaks', function () {
    this.view.render();
    expect(this.view).toHaveNoLeaks();
  });

  it('should render', function () {
    this.view.render();
    expect(this.view.$el.find('.js-menu').length).toBe(1);
    expect(this.view.$el.find('.js-content').length).toBe(1);
  });

  it('should toggle views', function () {
    this.view.render();
    var currentSelectedView = this.view._selectedView;
    expect(_.size(this.view._subviews)).toBe(3);

    this.view.collection.at(1).set('selected', true);

    expect(this.view._selectedView.cid !== currentSelectedView.cid).toBeTruthy();
    expect(_.size(this.view._subviews)).toBe(3);
  });

  afterEach(function () {
    this.view.clean();
  });
});
