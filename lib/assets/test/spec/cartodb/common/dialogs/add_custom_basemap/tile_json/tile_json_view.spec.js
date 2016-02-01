var cdb = require('cartodb.js-v3');
var TileJSONViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/tile_json/tile_json_view_model.js');

describe('common/dialog/add_custom_basemap/tile_json/tile_json_view', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new TileJSONViewModel({
      baseLayers: this.baseLayers
    });
    this.view = this.model.createView();
    this.view.render();
  });

  it('should render the set button as disabled initially', function() {
      expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
  });

  describe('when user written a URL', function() {
    beforeEach(function() {
      jasmine.clock().install();
      spyOn(cdb.admin.TileJSON.prototype, 'fetch');
    });

    describe('when URL is half-done', function() {
      beforeEach(function() {
        var $el = this.view.$('.js-url');
        $el.val('ht');
        $el.trigger('keydown');
        $el.val('htt');
        $el.trigger('keydown');
        jasmine.clock().tick(200);
      });

      it('should indicate that it is validating URL', function() {
        expect(this.innerHTML()).toMatch('js-validating.*display: inline');
      });

      describe('when triggers error', function() {
        beforeEach(function() {
          cdb.admin.TileJSON.prototype.fetch.calls.argsFor(0)[0].error();
        });

        it('should show error', function() {
          expect(this.view.$('.js-error').attr('class')).toContain('is-visible');
          expect(this.innerHTML()).toContain('Invalid URL');
        });

        it('should not indicate validating anymore', function() {
          expect(this.innerHTML()).not.toMatch('js-validating.*display: inline');
        });

        it('should disable OK button', function() {
          expect(this.view.$('.ok').attr('class')).toContain('is-disabled');
        });
      });

      describe('when finally written/pasted a valid URL', function() {
        beforeEach(function() {
          this.tileLayer = jasmine.createSpy('cdb.admin.TileLayer');
          spyOn(cdb.admin.TileJSON.prototype, 'newTileLayer').and.returnValue(this.tileLayer);
          jasmine.clock().tick(200);
          cdb.admin.TileJSON.prototype.fetch.calls.argsFor(0)[0].success();
        });

        it('should create layer with url', function() {
          expect(this.model.get('layer')).toBe(this.tileLayer);
        });

        it('should enable save button', function() {
          expect(this.view.$('.ok').attr('class')).not.toContain('is-disabled');
        });

        it('should hide error', function() {
          expect(this.view.$('.js-error').attr('class')).not.toContain('is-visible');
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
