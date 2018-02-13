var _ = require('underscore');
var EmbedOverlayView = require('cartodb3/embed/embed-overlay-view');
var legendsCanvas = require('cartodb3/embed/legends-canvas.tpl');

describe('embed/embed-overlay-view', function () {
  var TITLE = 'Awesome Embed Map';
  var view;

  var viewOptions = {
    title: TITLE,
    description: ''
  };

  var createViewFn = function (options) {
    return new EmbedOverlayView(_.extend({}, viewOptions, options));
  };

  it('should initialize properly', function () {
    view = createViewFn();

    expect(view.model.get('collapsed')).toBe(false);
  });

  describe('.render', function () {
    it('should render properly', function () {
      view = createViewFn();
      spyOn(view, '_renderContent');

      view.render();

      expect(view._renderContent).toHaveBeenCalled();
    });
  });

  describe('.initBinds', function () {
    it('should call ._toggleCollapsed when collapsed changes', function () {
      view = createViewFn();
      spyOn(view, '_toggleCollapsed');

      view._initBinds();
      view.model.set('collapsed', true);

      expect(view._toggleCollapsed).toHaveBeenCalled();
    });
  });

  describe('._renderContent', function () {
    it('should render content', function () {
      view = createViewFn();

      expect(view._renderContent()).toContain(TITLE);
      expect(view._renderContent()).toContain('<button class="CDB-Shape js-toggle u-lSpace">');
      expect(view._renderContent()).toContain('<div class="CDB-Overlay-inner is-active">');
    });
  });

  describe('._toggleCollapsed', function () {
    it('should toggle collapsed state', function () {
      view = createViewFn();

      view.render();

      expect(view.$('.CDB-ArrowToogle').hasClass('is-down')).toBe(true);
      expect(view.$('.CDB-Overlay-inner').hasClass('is-active')).toBe(true);

      view._toggle();

      expect(view.$('.CDB-ArrowToogle').hasClass('is-down')).toBe(false);
      expect(view.$('.CDB-Overlay-inner').hasClass('is-active')).toBe(false);
    });
  });

  describe('has description', function () {
    var description = 'Awesome description';

    beforeEach(function () {
      view = createViewFn({
        description: description
      });
    });

    describe('._renderContent', function () {
      it('should render content', function () {
        view.render();

        expect(view._renderContent()).toContain(description);
        expect(view._renderContent()).toContain('<button class="CDB-Shape js-toggle u-lSpace">');
        expect(view._renderContent()).toContain('<div class="CDB-Overlay-inner is-active">');
      });
    });

    describe('._toggle', function () {
      it('should toggle collapsed', function () {
        expect(view.model.get('collapsed')).toBe(false);

        view._toggle();

        expect(view.model.get('collapsed')).toBe(true);
      });
    });
  });

  describe('has template', function () {
    describe('._renderContent', function () {
      it('should render content', function () {
        view = createViewFn({
          template: legendsCanvas
        });

        view.render();

        expect(view._renderContent()).toContain('<div class="CDB-Legends-canvas is-overlay">');
      });
    });

    describe('has description', function () {
      var description = 'Awesome template description';

      describe('._renderContent', function () {
        it('should render content', function () {
          view = createViewFn({
            description: description,
            template: legendsCanvas
          });

          view.render();

          expect(view._renderContent()).toContain(description);
          expect(view._renderContent()).toContain('<button class="CDB-Shape js-toggle u-lSpace">');
          expect(view._renderContent()).toContain('<div class="CDB-Overlay-inner is-active is-description">');
        });
      });
    });
  });
});
