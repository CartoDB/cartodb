var _ = require('underscore');
var EmbedOverlayView = require('builder/embed/embed-overlay-view');

describe('embed/embed-overlay-view', function () {
  var TITLE = 'Awesome Embed Map';
  var DESCRIPTION = '';
  var view;

  var viewOptions = {
    title: TITLE,
    description: DESCRIPTION,
    showMenu: true
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
      spyOn(view, '_renderOverlay');

      view.render();

      expect(view._renderOverlay).toHaveBeenCalled();
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

  describe('._renderOverlay', function () {
    it('should render overlay template', function () {
      view = createViewFn();

      var options = {
        title: TITLE,
        description: DESCRIPTION,
        legends: true,
        showMenu: true
      };

      expect(view._renderOverlay(options)).toContain(TITLE);
      expect(view._renderOverlay(options)).toContain('<button class="CDB-Shape js-toggle u-lSpace">');
      expect(view._renderOverlay(options)).toContain('<div class="CDB-Overlay-inner is-active">');
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

    describe('._renderOverlay', function () {
      it('should render overlay template', function () {
        var options = {
          title: TITLE,
          description: description,
          legends: true,
          showMenu: true
        };

        expect(view._renderOverlay(options)).toContain(description);
        expect(view._renderOverlay(options)).toContain('<button class="CDB-Shape js-toggle u-lSpace">');
        expect(view._renderOverlay(options)).toContain('<div class="CDB-Overlay-inner is-active">');
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
});
