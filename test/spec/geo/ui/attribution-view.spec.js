var $ = require('jquery');
var _ = require('underscore');
var AttributionView = require('../../../../src/geo/ui/attribution/attribution-view');
var Map = require('../../../../src/geo/map');

describe('geo/ui/attribution', function () {
  beforeEach(function () {
    // Disable defer
    spyOn(_, 'delay').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.keyEsc = function () {
      var e = $.Event('keydown');
      e.keyCode = 27; // ESC
      $(document).trigger(e);
    };

    this.map = new Map(null, {
      layersFactory: {}
    });
    spyOn(this.map, 'bind').and.callThrough();
    spyOn(AttributionView.prototype, 'render').and.callThrough();

    this.view = new AttributionView({
      map: this.map
    });
    this.view.render();
    this.$button = this.view.$('.js-button');
    this.$text = this.view.$('.js-text');
    this.viewHasClass = function (className) {
      return this.view.$el.hasClass(className);
    };
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.$button.length).toBe(1);
      expect(this.$text.length).toBe(1);
    });

    it('should add GMaps properly when provider is not Leaflet', function () {
      expect(this.viewHasClass('CDB-Attribution--gmaps')).toBeFalsy();
      this.map.set('provider', 'gmaps');
      this.view.render();
      expect(this.viewHasClass('CDB-Attribution--gmaps')).toBeTruthy();
    });
  });

  describe('attributions change', function () {
    it('should render when it is visible', function () {
      this.$button.click(); // Making it visible
      this.map.trigger('change:attribution');
      expect(AttributionView.prototype.render).toHaveBeenCalled();
    });

    it('should render when it is not visible', function () {
      this.map.trigger('change:attribution');
      expect(AttributionView.prototype.render).toHaveBeenCalled();
    });
  });

  describe('when the attributions are displayed', function () {
    beforeEach(function () {
      this.$button.click();
    });

    it('should have is-active class', function () {
      expect(this.viewHasClass('is-active')).toBeTruthy();
    });

    it('should hide attributions text when js-button is clicked', function () {
      this.$button.click();
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should collapse the attributions when ESC is pressed', function () {
      this.keyEsc();
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should collapse the attributions when user clicks on the document', function () {
      $(document).trigger('click');
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });
  });

  describe('when attributions are hidden', function () {
    beforeEach(function () {
      this.$button.click();
      this.keyEsc();
    });

    it('shouldn\'t have is-active class', function () {
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should show attributions text when js-button is clicked', function () {
      this.$button.click();
      expect(this.viewHasClass('is-active')).toBeTruthy();
    });

    it('should not respond to ESC', function () {
      this.keyEsc();
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });

    it('should not respond to clicks on the document', function () {
      $(document).trigger('click');
      expect(this.viewHasClass('is-active')).toBeFalsy();
    });
  });
});
