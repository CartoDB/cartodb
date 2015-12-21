var $ = require('jquery');
var Attribution = require('../../../../src/geo/ui/attribution/attribution_view');
var Map = require('../../../../src/geo/map');

describe('geo/ui/attribution', function () {
  beforeEach(function () {
    this.keyEsc = function () {
      var e = $.Event('keydown');
      e.keyCode = 27; // ESC
      $(document).trigger(e);
    };

    this.map = new Map();
    spyOn(this.map, 'bind').and.callThrough();

    this.view = new Attribution({
      map: this.map
    });
    this.view.render();
    this.$button = this.view.$('.js-button');
    this.$text = this.view.$('.js-text');
  });

  describe('render', function () {
    it('should render properly', function () {
      expect(this.$text.length).toBe(1);
      expect(this.$button.length).toBe(1);
    });

    it('should add GMaps properly when provider is not Leaflet', function () {
      expect(this.view.$el.hasClass('CDB-Attribution--gmaps')).toBeFalsy();
      this.map.set('provider', 'gmaps');
      this.view.render();
      expect(this.view.$el.hasClass('CDB-Attribution--gmaps')).toBeTruthy();
    });
  });

  describe('binding', function () {
    beforeEach(function () {
      spyOn(this.view, '_onKeyDown').and.callThrough();
      spyOn(this.view, '_hideAttributions').and.callThrough();
      spyOn(this.view, 'render').and.callThrough();
    });

    it('should render when map attributions has changed', function () {
      this.view._showAttributions();
      this.map.trigger('change:attribution');
      expect(this.view.render).toHaveBeenCalled();
    });

    it('should not have any map bind when attributions text is not visible', function () {
      expect(this.map.bind).not.toHaveBeenCalled();
      $(document).trigger('click');
      expect(this.view._hideAttributions).not.toHaveBeenCalled();
    });

    it('should have document click bind when attributions text is not visible', function () {
      $(document).trigger('click');
      expect(this.view._hideAttributions).not.toHaveBeenCalled();
    });

    it('should not have any keyup bind when attributions text is not visible', function () {
      this.keyEsc();
      expect(this.view._onKeyDown).not.toHaveBeenCalled();
    });

    describe('on visible', function () {
      beforeEach(function () {
        this.view._showAttributions();
      });

      it('should have map bind when attributions text is visible', function () {
        expect(this.map.bind).toHaveBeenCalled();
      });

      it('should have document click bind when attributions text is visible', function () {
        expect(this.view._hideAttributions.calls.count()).toEqual(0);
        $(document).trigger('click');
        expect(this.view._hideAttributions).toHaveBeenCalled();
        expect(this.view._hideAttributions.calls.count()).toEqual(1);
        $(document).trigger('click');
        expect(this.view._hideAttributions.calls.count()).toEqual(1);
      });

      it('should have keyup bind when attributions text is visible', function () {
        expect(this.view._onKeyDown.calls.count()).toEqual(0);
        this.keyEsc();
        expect(this.view._onKeyDown).toHaveBeenCalled();
        expect(this.view._onKeyDown.calls.count()).toEqual(1);
        this.keyEsc();
        expect(this.view._onKeyDown.calls.count()).toEqual(1);
      });
    });
  });

  describe('visibility', function () {
    beforeEach(function () {
      spyOn(this.view, '_hideAttributions').and.callThrough();
      this.$button.click();
    });

    it('should show text when button is clicked', function () {
      expect(this.$button.hasClass('is-visible')).toBeFalsy();
      expect(this.$text.hasClass('is-visible')).toBeTruthy();
    });

    it('should hide text when ESC is pressed', function () {
      this.keyEsc();
      expect(this.$button.hasClass('is-visible')).toBeTruthy();
      expect(this.$text.hasClass('is-visible')).toBeFalsy();
    });

    it('should hide text when user clicks anywhere', function () {
      $(document).trigger('click');
      expect(this.$button.hasClass('is-visible')).toBeTruthy();
      expect(this.$text.hasClass('is-visible')).toBeFalsy();
    });
  });
});
