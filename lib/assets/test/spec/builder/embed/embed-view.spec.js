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
    showLegends: true
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

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
      view.render();
    });

    it('should render properly', function () {
      expect(view.el.innerHTML).toContain(TITLE);
      expect(view.$('.js-tabs').length).toBe(1);
      expect(view.$('.js-embed-map').length).toBe(1);
      expect(view.$('.js-embed-legends').length).toBe(1);
      expect(_.size(view._subviews)).toBe(1); // [TabsView]
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
      it('should render properly', function () {
        $legendsEl.hide();

        view.injectTitle($el);

        expect(_.size(view._subviews)).toBe(2); // [TabsView, EmbedOverlay]
        expect(view.el.innerHTML).toContain(TITLE);
      });
    });

    describe('legends are visible', function () {
      it('should move legends', function () {
        expect($legendsEl.children('.CDB-LayerLegends').length).toBe(1);

        view.injectTitle($el);

        expect($legendsEl.children('.CDB-LayerLegends').length).toBe(0);
        expect($el.find('.CDB-Overlay-inner').children('.CDB-LayerLegends').length).toBe(1);
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
