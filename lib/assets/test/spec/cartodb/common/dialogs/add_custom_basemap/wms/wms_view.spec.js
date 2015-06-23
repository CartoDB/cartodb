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
          this.model.get('layers').add({ name: ""});
          this.model.get('layers').fetch.calls.argsFor(0)[1]();
        });

        it('should change to select layer view', function() {
          expect(this.innerHTML()).toContain('found');
        });

        it('should show the search form', function() {
          expect(this.innerHTML()).toContain('Search');
        });
      });

      describe('when there are several layers fetched', function() {
        beforeEach(function() {
          this.model.get('layers').add([
            { name: "Bageshwar" },
            { name: "Bagaha" },
            { name: "Bahadurgarh" }, 
            { name: "baharampur" },
            { name: "Bahraich" },
            { name: "Chirmiri" }
          ]);
          this.model.get('layers').fetch.calls.argsFor(0)[1]();
          this.model.set('layersFetched', true);
        });

        it('should allow to search', function() {
          this.view.$el.find(".js-search-input").val("Bah");
          this.view.$el.find(".js-search-link").click();
          expect(this.innerHTML()).toContain('Bahraich');
          expect(this.innerHTML()).toContain('Bahadurgarh');
          expect(this.innerHTML()).toContain('baharampur');
          expect(this.innerHTML()).not.toContain('Chirmiri');
        });

        it('should close the search', function() {
          this.view.$el.find(".js-search-input").val("Bah");
          this.view.$el.find(".js-search-link").click();
          this.view.$el.find(".js-clean-search").click();
          expect(this.view.$el.find(".js-search-input").val()).toBeFalsy();
          expect(this.innerHTML()).toContain('Bageshwar');
          expect(this.innerHTML()).toContain('Bagaha');
          expect(this.innerHTML()).toContain('Bahraich');
          expect(this.innerHTML()).toContain('Bahadurgarh');
          expect(this.innerHTML()).toContain('baharampur');
          expect(this.innerHTML()).toContain('Chirmiri');
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

        it("shouldn't show the search form", function() {
          expect(this.innerHTML()).not.toContain('Search');
        });
      });

      describe('when layer is added', function() {
        beforeEach(function() {
          this.model.set('currentView', 'savingLayer');
        });

        it('should show saving layer indicator', function() {
          expect(this.innerHTML()).toContain('Saving layer…');
        });

        describe('when layer is not saved', function() {
          beforeEach(function() {
            this.model.set('currentView', 'saveFail');
          });

          it('should show error view', function() {
            expect(this.innerHTML()).toContain('error');
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
