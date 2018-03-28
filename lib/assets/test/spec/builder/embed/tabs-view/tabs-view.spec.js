var _ = require('underscore');
var Backbone = require('backbone');
var TabsView = require('builder/embed/tabs/tabs-view');

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
    it('should render properly when there is no title in tabs', function () {
      view = createViewFn();
      view.render();

      expect(view.$('.js-tabs-container').length).toBe(1);
      expect(view.$('.js-tab').length).toBe(2);

      var tabsMarkup = view.$('.js-tabs-container').html();
      expect(tabsMarkup).toContain('data-tab="' + viewOptions.tabs[0].name);
      expect(tabsMarkup).toContain(viewOptions.tabs[0].name + '</button>');
      expect(tabsMarkup).toContain('data-tab="' + viewOptions.tabs[1].name);
      expect(tabsMarkup).toContain(viewOptions.tabs[1].name + '</button>');
      expect(view.$('.js-tab.is-selected[data-tab="' + viewOptions.tabs[0].name + '"]').length).toBe(1);
    });

    it('should render properly when there is title in tabs', function () {
      var options = {
        tabs: [
          { name: 'map', title: 'mapTitle', isSelected: true },
          { name: 'legends', title: 'layers' }
        ]
      };
      view = createViewFn(options);
      view.render();

      expect(view.$('.js-tabs-container').length).toBe(1);
      expect(view.$('.js-tab').length).toBe(2);

      var tabsMarkup = view.$('.js-tabs-container').html();
      expect(tabsMarkup).toContain('data-tab="' + options.tabs[0].name);
      expect(tabsMarkup).toContain(options.tabs[0].title + '</button>');
      expect(tabsMarkup).toContain('data-tab="' + options.tabs[1].name);
      expect(tabsMarkup).toContain(options.tabs[1].title + '</button>');
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
