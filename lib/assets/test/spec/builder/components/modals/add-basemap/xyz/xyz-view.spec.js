var _ = require('underscore');
var $ = require('jquery');
var XYZView = require('builder/components/modals/add-basemap/xyz/xyz-view');
var XYZModel = require('builder/components/modals/add-basemap/xyz/xyz-model');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

describe('components/modals/add-basemap/xyz/xyz-view', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    var submitButton = $('<button class="is-disabled">Submit</button>');

    this.model = new XYZModel();
    this.view = new XYZView({
      model: this.model,
      submitButton: submitButton
    });
    this.view.render();
  });

  it('should render the set button as disabled initially', function () {
    expect(this.view._submitButton.hasClass('is-disabled')).toBe(true);
  });

  it('should change TMS checkbox when model changes', function () {
    expect(this.view.$('.js-tms .Checkbox-input').hasClass('is-checked')).toBeFalsy();
    this.view.model.set('tms', true);
    expect(this.view.$('.js-tms .Checkbox-input').hasClass('is-checked')).toBeTruthy();
  });

  describe('when user written a URL', function () {
    describe('when URL is half-done or invalid', function () {
      beforeEach(function () {
        var $el = this.view.$('.js-url');
        $el.val('ht');
        $el.trigger('keydown');
        $el.val('htt');
        $el.trigger('keydown');
      });

      it('should show error', function () {
        expect(this.view.$('.js-error').attr('class')).toContain('is-visible');
        expect(this.innerHTML()).toContain('components.modals.add-basemap.xyz.not-valid');
      });

      it('should disable OK button', function () {
        expect(this.view._submitButton.hasClass('is-disabled')).toBe(true);
      });
    });

    describe('when finally written/pasted a valid URL', function () {
      beforeEach(function () {
        this.layer = new CustomBaselayerModel({
          id: 'basemap-id-2',
          urlTemplate: 'https://b.example.com/{z}/{x}/{y}.png',
          attribution: null,
          maxZoom: 21,
          minZoom: 0,
          name: '',
          tms: false,
          category: 'Custom',
          type: 'Tiled'
        });
        spyOn(this.layer, 'validateTemplateURL');
      });

      describe('when URL does not have a valid XYZ format', function () {
        beforeEach(function () {
          spyOn(this.view, '_byCustomURL').and.throwError();

          this.view.$('.js-url')
            .val('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png')
            .trigger('keydown');
        });

        it('should show error', function () {
          expect(this.innerHTML()).toContain('components.modals.add-basemap.xyz.not-valid');
        });
      });

      describe('when URL has a valid XYZ format', function () {
        beforeEach(function () {
          spyOn(this.view, '_byCustomURL').and.returnValue(this.layer);

          this.view.$('.js-url')
            .val('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png')
            .trigger('keydown');
        });

        it('should create layer with url', function () {
          expect(this.view._byCustomURL).toHaveBeenCalledWith('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', false);
        });

        it('should set the layer on the view model', function () {
          expect(this.model.get('layer')).toBe(this.layer);
        });

        it('should disable the save button', function () {
          expect(this.view._submitButton.attr('class')).toContain('is-disabled');
        });

        it('should hide error', function () {
          expect(this.view.$('.js-error').attr('class')).not.toContain('is-visible');
        });

        it('should validate template URL', function () {
          expect(this.layer.validateTemplateURL).toHaveBeenCalledWith({
            success: jasmine.any(Function),
            error: jasmine.any(Function)
          });
        });

        describe('when URL is finally validated', function () {
          beforeEach(function () {
            this.layer.validateTemplateURL.calls.argsFor(0)[0].success();
          });

          it('should enable save button', function () {
            expect(this.view._submitButton.attr('class')).not.toContain('is-disabled');
          });

          it('should hide error', function () {
            expect(this.view.$('.js-error').attr('class')).not.toContain('is-visible');
          });
        });

        describe('when URL fails to be validated', function () {
          beforeEach(function () {
            this.layer.validateTemplateURL.calls.argsFor(0)[0].error();
          });

          it('should enable save button', function () {
            expect(this.view._submitButton.attr('class')).not.toContain('is-disabled');
          });

          it('should show error', function () {
            expect(this.view.$('.js-error').attr('class')).toContain('is-visible');
            expect(this.innerHTML()).toContain('components.modals.add-basemap.xyz.couldnt-validate');
          });
        });
      });
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function () {
    this.view.clean();
  });
});
