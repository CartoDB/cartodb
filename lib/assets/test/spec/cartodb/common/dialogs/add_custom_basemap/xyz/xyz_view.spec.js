var cdb = require('cartodb.js-v3');
var XYZView = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/xyz/xyz_view.js');
var XYZViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/xyz/xyz_model.js');

describe('common/dialog/add_custom_basemap/xyz/xyz_view', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new XYZViewModel({
      baseLayers: this.baseLayers
    });
    this.view = new XYZView({
      model: this.model
    });
    this.view.render();
  });

  it('should render the set button as disabled initially', function() {
      expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
  });

  it('should change TMS checkbox when model changes', function() {
    expect(this.view.$('.js-tms .Checkbox-input').hasClass('is-checked')).toBeFalsy();
    this.view.model.set('tms', true);
    expect(this.view.$('.js-tms .Checkbox-input').hasClass('is-checked')).toBeTruthy();
  });

  describe('when user written a URL', function() {
    beforeEach(function() {
      jasmine.clock().install();
    });

    describe('when URL is half-done or invalid', function() {
      beforeEach(function() {
        var $el = this.view.$('.js-url');
        $el.val('ht');
        $el.trigger('keydown');
        $el.val('htt');
        $el.trigger('keydown');
        jasmine.clock().tick(200);
      });

      it('should show error', function() {
        expect(this.view.$('.js-error').attr('class')).toContain('is-visible');
        expect(this.innerHTML()).toContain('does not look like a valid XYZ URL');
      });

      it('should disable OK button', function() {
        expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
      });
    });

    describe('when finally written/pasted a valid URL', function() {
      beforeEach(function() {
        this.layer = new cdb.admin.TileLayer();
        spyOn(this.layer, 'validateTemplateURL');
      });

      describe('when URL does not have a valid XYZ format', function() {
        beforeEach(function() {
          spyOn(cdb.admin.TileLayer, 'byCustomURL').and.throwError();
          this.view.$('.js-url')
            .val('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png')
            .trigger('keydown');
        });

        it('should show error', function() {
          jasmine.clock().tick(200);
          expect(this.innerHTML()).toContain('not look like a valid XYZ');
        });
      });

      describe('when URL has a valid XYZ format', function() {
        beforeEach(function() {
          spyOn(cdb.admin.TileLayer, 'byCustomURL').and.returnValue(this.layer);
          this.view.$('.js-url')
            .val('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png')
            .trigger('keydown');
        });

        it('should create layer with url', function() {
          expect(cdb.admin.TileLayer.byCustomURL).not.toHaveBeenCalled();
          jasmine.clock().tick(200);
          expect(cdb.admin.TileLayer.byCustomURL).toHaveBeenCalled();
          expect(cdb.admin.TileLayer.byCustomURL).toHaveBeenCalledWith('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', false);
        });

        it('should set the layer on the view model', function() {
          expect(this.model.get('layer')).toBeUndefined();
          jasmine.clock().tick(200);
          expect(this.model.get('layer')).toBe(this.layer);
        });

        it('should disable the save button', function() {
          jasmine.clock().tick(200);
          expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
        });

        it('should hide error', function() {
          jasmine.clock().tick(200);
          expect(this.view.$('.js-error').attr('class')).not.toContain('is-visible');
        });

        it('should validate template URL', function() {
          expect(this.layer.validateTemplateURL).not.toHaveBeenCalled();
          jasmine.clock().tick(200);
          expect(this.layer.validateTemplateURL).toHaveBeenCalled();
          expect(this.layer.validateTemplateURL).toHaveBeenCalledWith({
            success: jasmine.any(Function),
            error: jasmine.any(Function)
          });
        });

        describe('when URL is finally validated', function() {
          beforeEach(function() {
            jasmine.clock().tick(200);
            this.layer.validateTemplateURL.calls.argsFor(0)[0].success();
          });

          it('should enable save button', function() {
            expect(this.view.$('.ok').attr('class')).not.toContain('is-disabled');
          });

          it('should hide error', function() {
            expect(this.view.$('.js-error').attr('class')).not.toContain('is-visible');
          });
        });

        describe('when URL fails to be validated', function() {
          beforeEach(function() {
            jasmine.clock().tick(200);
            this.layer.validateTemplateURL.calls.argsFor(0)[0].error();
          });

          it('should enable save button', function() {
            expect(this.view.$('.ok').attr('class')).not.toContain('is-disabled');
          });

          it('should show error', function() {
            expect(this.view.$('.js-error').attr('class')).toContain('is-visible');
            expect(this.innerHTML()).toContain("couldn't validate this");
          });
        });
      });
    });

    afterEach(function() {
      jasmine.clock().uninstall();
    });
  });

  it('should not have any leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  afterEach(function() {
    this.view.clean();
  });
});
