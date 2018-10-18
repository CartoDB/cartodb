var $ = require('jquery');
var _ = require('underscore');
var EmbedView = require('builder/embed/embed-view');

describe('embed/embed-view', function () {
  var TITLE = 'Awesome Embed Map';
  var view;
  var onSelectedTabChangedSpy;

  var viewOptions = {
    title: TITLE,
    description: '',
    showMenu: true,
    showLegends: true,
    showLayerSelector: false
  };

  var createViewFn = function (options) {
    return new EmbedView(_.extend({}, viewOptions, options));
  };

  beforeEach(function () {
    onSelectedTabChangedSpy = spyOn(EmbedView.prototype, '_onSelectedTabChanged');
  });

  it('should have Tabs Model', function () {
    view = createViewFn();
    expect(view._tabsModel).toBeDefined();
  });

  describe('.initialize', function () {
    describe('_showLegends and _onlyLayerSelector', function () {
      it('should be true and false respectively if showLegends is true and showLayerSelector is false', function () {
        view = createViewFn({
          showLegends: true,
          showLayerSelector: false
        });

        expect(view._showLegends).toBe(true);
        expect(view._showLayerSelector).toBe(false);
      });

      it('should be both true if showLegends is false and showLayerSelector is true', function () {
        view = createViewFn({
          showLegends: false,
          showLayerSelector: true
        });

        expect(view._showLegends).toBe(true);
        expect(view._showLayerSelector).toBe(true);
      });

      it('should be both false if showLegends and showLayerSelector is false', function () {
        view = createViewFn({
          showLegends: false,
          showLayerSelector: false
        });

        expect(view._showLegends).toBe(false);
        expect(view._showLayerSelector).toBe(false);
      });
    });
  });

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should render properly', function () {
      view = createViewFn();
      view.render();

      expect(view.el.innerHTML).toContain(TITLE);
      expect(view.$('.js-tabs').length).toBe(1);
      expect(view.$('.js-embed-map').length).toBe(1);
      expect(view.$('.js-embed-legends').length).toBe(1);
      expect(_.size(view._subviews)).toBe(1); // [TabsView]
    });

    it('should configure tabs correctly if there are legends', function () {
      view = createViewFn();
      view.render();

      expect(_.size(view._subviews)).toBe(1);
      var tabView = view._subviews[Object.keys(view._subviews)[0]];
      expect(tabView.options.tabs[0]).toEqual({
        name: 'map',
        title: 'map',
        isSelected: true
      });
      expect(tabView.options.tabs[1]).toEqual({
        name: 'legends',
        title: 'legends'
      });
    });

    it('should configure tabs correctly if only there is layer selector', function () {
      view = createViewFn({
        showLegends: false,
        showLayerSelector: true
      });
      view.render();

      expect(_.size(view._subviews)).toBe(1);
      var tabView = view._subviews[Object.keys(view._subviews)[0]];
      expect(tabView.options.tabs[0]).toEqual({
        name: 'map',
        title: 'map',
        isSelected: true
      });
      expect(tabView.options.tabs[1]).toEqual({
        name: 'legends',
        title: 'layers'
      });
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should call _onSelectedTabChanged when selected tab changes', function () {
      view._tabsModel.set({ selected: 'legends' });
      expect(view._onSelectedTabChanged).toHaveBeenCalled();
    });
  });

  describe('._onSelectedTabChanged', function () {
    beforeEach(function () {
      onSelectedTabChangedSpy.and.callThrough();
      view = createViewFn();
      view.render();
    });

    it('should change selected tab', function () {
      expect(view.$('.js-embed-map').hasClass('is-active')).toBe(true);
      expect(view.$('.js-embed-legends').hasClass('is-active')).toBe(false);

      view._tabsModel.set({ selected: 'legends' }, { silent: true });
      view._onSelectedTabChanged();

      expect(view.$('.js-embed-map').hasClass('is-active')).toBe(false);
      expect(view.$('.js-embed-legends').hasClass('is-active')).toBe(true);
    });
  });

  describe('has description', function () {
    var description = 'Awesome description';

    beforeEach(function () {
      view = createViewFn({
        description: description
      });
      view.render();
    });

    describe('.render', function () {
      it('should render properly', function () {
        expect(view.el.innerHTML).toContain(description);
      });
    });
  });

  describe('when showMenu is false', function () {
    describe('.render', function () {
      beforeEach(function () {
        view = createViewFn({ showMenu: false });
        view.render();
      });

      it('should render properly', function () {
        expect(view.el.innerHTML).not.toContain(TITLE);
      });
    });
  });

  describe('when showLegends is false', function () {
    beforeEach(function () {
      view = createViewFn({ showLegends: false });
      view.render();
    });

    it('should not have Tabs Model', function () {
      expect(view._tabsModel).not.toBeDefined();
    });

    describe('.render', function () {
      it('should render properly', function () {
        expect(view.$('.js-tabs').length).toBe(0);
        expect(view.$('.js-embed-legends').length).toBe(0);
        expect(_.size(view._subviews)).toBe(0);
      });
    });
  });

  describe('.injectTitle', function () {
    var $el;
    var $legendsEl;

    beforeEach(function () {
      $legendsEl = $('<div class="CDB-Legends-canvasInner"><div class="CDB-LayerLegends"></div></div>');
      $el = $('<div><div class="CDB-Overlay-inner"></div></div>').append($legendsEl);
      $('body').append($el);

      view = createViewFn();
      view.render();
    });

    afterEach(function () {
      $el.remove();
    });

    describe('.render', function () {
      it('should render properly if legends are visible', function () {
        $legendsEl.show();

        view.injectTitle($el);

        expect(_.size(view._subviews)).toBe(2);
        expect(view.el.innerHTML).toContain(TITLE);
      });

      it('should render properly if legends are hidden', function () {
        $legendsEl.hide();

        view.injectTitle($el);

        expect(_.size(view._subviews)).toBe(2);
        expect(view.el.innerHTML).toContain(TITLE);
      });
    });

    describe('has description', function () {
      var description = 'Awesome description';

      beforeEach(function () {
        view = createViewFn({
          description: description
        });
        view.render();
      });

      describe('.render', function () {
        it('should render properly', function () {
          expect(view.el.innerHTML).toContain(description);
        });
      });
    });
  });
});
