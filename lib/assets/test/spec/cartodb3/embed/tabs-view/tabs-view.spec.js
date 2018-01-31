var _ = require('underscore');
var Backbone = require('backbone');
var TabsView = require('../../../../../javascripts/cartodb3/embed/tabs/tabs-view');

describe('embed/tabs/tabs-view', function () {
  var view;
  var viewOptions = {
    model: new Backbone.Model(),
    tabs: [
      { name: 'map', isSelected: true },
      { name: 'legends' }
    ]
  };

  var createViewFn = function (options) {
    return new TabsView(_.extend({}, viewOptions, options));
  };

  afterEach(function () {
    view.clean();
  });

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should render properly', function () {
      expect(view.$('.js-tabs-container').length).toBe(1);
      expect(view.$('.js-tab').length).toBe(2);

      expect(view.$('.js-tabs-container').html()).toContain(viewOptions.tabs[0].name);
      expect(view.$('.js-tabs-container').html()).toContain(viewOptions.tabs[1].name);

      expect(view.$('.js-tab.is-selected[data-tab="' + viewOptions.tabs[0].name + '"]').length).toBe(1);
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      spyOn(TabsView.prototype, '_onSelectedTabChanged');
      view = createViewFn();
    });

    it('should call _onSelectedTabChanged when selected tab changes', function () {
      view.model.set({ selected: 'legends' });
      expect(view._onSelectedTabChanged).toHaveBeenCalled();
    });
  });

  describe('._onTabClicked', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should call _onSelectedTabChanged when selected tab changes', function () {
      var legendsTab = view.$('.js-tab[data-tab="legends"]');
      legendsTab.click();

      expect(view.model.get('selected')).toBe('legends');
    });
  });
});
