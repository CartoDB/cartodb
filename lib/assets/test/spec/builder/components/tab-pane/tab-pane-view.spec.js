var _ = require('underscore');
var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var TabPaneView = require('builder/components/tab-pane/tab-pane-view');
var TabPaneCollection = require('builder/components/tab-pane/tab-pane-collection');

describe('components/tab-pane-view', function () {
  var mouseOverAction;

  beforeEach(function () {
    this.collection = new TabPaneCollection();

    var model = new Backbone.Model({
      name: 'first',
      createContentView: function () {
        return new CoreView();
      },
      createButtonView: function () {
        return new CoreView();
      }
    });

    var model2 = new Backbone.Model({
      name: 'second',
      createContentView: function () {
        return new CoreView();
      },
      createButtonView: function () {
        return new CoreView();
      }
    });

    this.collection.reset([model, model2]);

    mouseOverAction = jasmine.createSpy();

    this.view = new TabPaneView({
      collection: this.collection,
      mouseOverAction: mouseOverAction
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

  it('should allow to select a collection item by name', function () {
    this.view.render();
    this.view.setSelectedTabPaneByName('second');
    expect(this.view.collection.at(1).get('selected')).toBeTruthy();

    this.view.setSelectedTabPaneByName('first');
    expect(this.view.collection.at(0).get('selected')).toBeTruthy();
  });

  it('should trigger mouseOverAction when is hovered', function () {
    this.view.render();

    this.view.$el.trigger('mouseover');

    expect(mouseOverAction).toHaveBeenCalled();
  });
});
