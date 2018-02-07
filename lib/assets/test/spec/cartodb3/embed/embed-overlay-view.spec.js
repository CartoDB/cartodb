var _ = require('underscore');
var EmbedOverlayView = require('cartodb3/embed/embed-overlay-view');

describe('embed/embed-overlay-view', function () {
  var TITLE = 'Awesome Embed Map';
  var view;
  var renderSpy;

  var viewOptions = {
    title: TITLE,
    description: ''
  };

  var createViewFn = function (options) {
    renderSpy = spyOn(EmbedOverlayView.prototype, 'render');

    return new EmbedOverlayView(_.extend({}, viewOptions, options));
  };

  it('should initialize properly', function () {
    view = createViewFn();

    expect(view.model.get('collapsed')).toBe(false);
  });

  describe('.render', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should render properly', function () {
      renderSpy.and.callThrough();

      view.render();

      expect(view.el.innerHTML).toContain(TITLE);
    });
  });

  describe('.initBinds', function () {
    beforeEach(function () {
      view = createViewFn();
    });

    it('should call .render when collapsed changes', function () {
      view._initBinds();

      view.model.set('collapsed', true);

      expect(renderSpy).toHaveBeenCalled();
    });
  });

  describe('has description', function () {
    var description = 'Awesome description';

    beforeEach(function () {
      view = createViewFn({
        description: description
      });
    });

    describe('.render', function () {
      it('should render properly', function () {
        renderSpy.and.callThrough();

        view.render();

        expect(view.el.innerHTML).toContain(description);
        expect(view.el.innerHTML).toContain('<button class="CDB-Shape js-toggle u-lSpace">');
      });
    });

    describe('._toggle', function () {
      it('should toggle description', function () {
        renderSpy.and.callThrough();

        view.render();

        expect(view.$('.CDB-ArrowToogle').hasClass('is-down')).toBe(true);
        expect(view.$('.CDB-Overlay-inner').hasClass('is-active')).toBe(true);

        view._toggle();

        expect(view.$('.CDB-ArrowToogle').hasClass('is-down')).toBe(false);
        expect(view.$('.CDB-Overlay-inner').hasClass('is-active')).toBe(false);
      });
    });
  });
});
