var WMSViewModel = require('../../../../../../../javascripts/cartodb/common/dialogs/add_custom_basemap/wms/wms_model.js');

describe('common/dialog/add_custom_basemap/wms/wms_view', function() {
  beforeEach(function() {
    this.baseLayers = new cdb.admin.UserLayers();
    this.model = new WMSViewModel({
      baseLayers: this.baseLayers
    });
    this.view = this.model.createView();
    this.view.render();
  });

  it('should render the set button as disabled initially', function() {
      expect(this.view.$('.js-fetch-layers').attr('class')).toContain('is-disabled');
  });

  describe('when user written a URL', function() {
    beforeEach(function() {
      jasmine.clock().install();
      var $el = this.view.$('.js-url');
      $el.val('http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml');
      $el.trigger('keydown');
      jasmine.clock().tick(200);
    });

    it('should enable get-layers button', function() {
      expect(this.view.$('.js-fetch-layers').attr('class')).not.toContain('is-disabled');
    });

    describe('when click fetch layers', function() {
      beforeEach(function() {
        spyOn(this.model.get('layers'), 'fetch');
        spyOn(this.model, 'fetchLayers').and.callThrough();
        this.view.$('.js-fetch-layers').click();
      });

      it('should show fetching layers', function() {
        expect(this.innerHTML()).toContain('Fetching');
      });

      it('should call fetch layers on view model', function() {
        expect(this.model.fetchLayers).toHaveBeenCalled();
      });

      describe('when there is at least one layer fetched', function() {
        beforeEach(function() {
          this.model.get('layers').add({});
          this.model.get('layers').fetch.calls.argsFor(0)[1]();
        });

        it('should change to select layer view', function() {
          expect(this.innerHTML()).toContain('found');
        });
      });

      describe('when there are no layers fetched', function() {
        beforeEach(function() {
          this.model.get('layers').reset();
          this.model.get('layers').fetch.calls.argsFor(0)[1]();
          this.model.set('layersFetched', true);
        });

        it('should set back to enter url view', function() {
          expect(this.innerHTML()).toContain('Insert your');
        });

        it('should show an error indicating URL being invalid', function() {
          expect(this.innerHTML()).toContain('unsupported projections');
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
