var _ = require('underscore');
var $ = require('jquery');
var WMSView = require('builder/components/modals/add-basemap/wms/wms-view');
var WMSModel = require('builder/components/modals/add-basemap/wms/wms-model');
var ConfigModel = require('builder/data/config-model');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');

describe('editor/components/modals/add-basemap/wms/wms-view', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: 'https://a.example.com/{z}/{x}/{y}.png',
        category: 'Custom',
        className: 'httpsaexamplecomzxypng'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new WMSModel(null, {
      customBaselayersCollection: this.customBaselayersCollection
    });

    var submitButton = $('<button class="is-disabled">Submit</button>');
    var modalFooter = $('<div></div>');

    this.view = new WMSView({
      model: this.model,
      customBaselayersCollection: this.customBaselayersCollection,
      submitButton: submitButton,
      modalFooter: modalFooter
    });
    this.view.render();
  });

  it('should render the set button as disabled initially', function () {
    expect(this.view._submitButton.hasClass('is-disabled')).toBe(true);
  });

  describe('when user written a URL', function () {
    beforeEach(function () {
      var $el = this.view.$('.js-url');
      $el.val('http://openlayers.org/en/v3.5.0/examples/data/ogcsample.xml');
      $el.trigger('keydown');
    });

    it('should enable get-layers button', function () {
      expect(this.view._submitButton.hasClass('is-disabled')).toBe(false);
    });

    describe('when click fetch layers', function () {
      beforeEach(function () {
        this.model.wmsLayersCollection.sync = function (a, b, opts) {
        };

        spyOn(this.model, 'fetchLayers').and.callThrough();
        this.view._submitButton.click();
      });

      it('should show fetching layers', function () {
        expect(this.innerHTML()).toContain('components.modals.add-basemap.fetching');
      });

      it('should call fetch layers on view model', function () {
        expect(this.model.fetchLayers).toHaveBeenCalled();
      });

      describe('when there is at least one layer fetched', function () {
        beforeEach(function () {
          this.model.wmsLayersCollection.reset([{ name: '' }]);
        });

        it('should change to select layer view', function () {
          expect(this.innerHTML()).toContain('components.modals.add-basemap.wms.placeholder');
        });

        it('should show the search form', function () {
          expect(this.innerHTML()).toContain('components.modals.add-layer.navigation.search');
        });
      });

      describe('when there are several layers fetched', function () {
        beforeEach(function () {
          this.model.wmsLayersCollection.reset([
            { name: 'Bageshwar' },
            { name: 'Bagaha' },
            { name: 'Bahadurgarh' },
            { name: 'baharampur' },
            { name: 'Bahraich' },
            { name: 'Chirmiri' }
          ]);
        });

        it('should allow to search', function () {
          this.view.$el.find('.js-search-input').val('Bah');
          this.view.$el.find('.js-search-link').click();
          expect(this.innerHTML()).toContain('Bahraich');
          expect(this.innerHTML()).toContain('Bahadurgarh');
          expect(this.innerHTML()).toContain('baharampur');
          expect(this.innerHTML()).not.toContain('Chirmiri');
        });

        it('should show a no result search', function () {
          this.view.$el.find('.js-search-input').val('León');
          this.view.$el.find('.js-search-link').click();
          expect(this.innerHTML()).toContain('components.modals.add-basemap.wms.unfortunately');
        });

        it('should close the search', function () {
          this.view.$el.find('.js-search-input').val('Bah');
          this.view.$el.find('.js-search-link').click();
          this.view.$el.find('.js-clean-search').click();
          expect(this.view.$el.find('.js-search-input').val()).toBeFalsy();
          expect(this.innerHTML()).toContain('Bageshwar');
          expect(this.innerHTML()).toContain('Bagaha');
          expect(this.innerHTML()).toContain('Bahraich');
          expect(this.innerHTML()).toContain('Bahadurgarh');
          expect(this.innerHTML()).toContain('baharampur');
          expect(this.innerHTML()).toContain('Chirmiri');
        });
      });

      describe('when there are no layers fetched', function () {
        beforeEach(function () {
          this.model.wmsLayersCollection.reset();
        });

        it('should set back to enter url view', function () {
          expect(this.innerHTML()).toContain('components.modals.add-basemap.wms.insert');
        });

        it('should show an error indicating URL being invalid', function () {
          expect(this.innerHTML()).toContain('components.modals.add-basemap.wms.invalid');
        });

        it("shouldn't show the search form", function () {
          expect(this.innerHTML()).not.toContain('components.modals.add-layer.navigation.search');
        });
      });

      describe('when layer is added', function () {
        beforeEach(function () {
          this.model.set('currentView', 'savingLayer');
        });

        it('should show saving layer indicator', function () {
          expect(this.innerHTML()).toContain('components.modals.add-basemap.saving');
        });

        describe('when layer is not saved', function () {
          beforeEach(function () {
            this.model.set('currentView', 'saveFail');
          });

          it('should show error view', function () {
            expect(this.innerHTML()).toContain('error');
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
