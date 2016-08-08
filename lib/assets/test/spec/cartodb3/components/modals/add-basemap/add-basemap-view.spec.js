var Backbone = require('backbone');
var AddBasemapView = require('../../../../../../javascripts/cartodb3/components/modals/add-basemap/add-basemap-view');
var AddBasemapModel = require('../../../../../../javascripts/cartodb3/components/modals/add-basemap/add-basemap-model');
var BasemapsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemaps-collection');
var CustomBaselayersCollection = require('../../../../../javascripts/cartodb3/data/custom-baselayers-collection');

describe('components/modals/add-basemap/add-basemap-view', function() {
  beforeEach(function() {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });

    this.basemaps = {
      CARTO: {
        positron_rainbow: {
          className: 'positron_rainbow',
          url: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'
        },
        dark_matter_rainbow: {
          className: 'dark_matter_rainbow',
          url: 'http://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'
        }
      },
      Stamen: {
        watercolor: {
          className: 'watercolor_stamen',
          url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg'
        }
      },
      Here: {
        nokia_day: {
          className: 'nokia_day',
          url: 'https://{s}.maps.nlp.nokia.com/maptile/2.1/maptile/newest/normal.day/{z}/{x}/{y}/256/png8?lg=eng&token='
        }
      }
    };

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
    });
    this.layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo',
        className: 'positron_rainbow',
        category: 'CARTO'
      }
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: '',
        category: 'Custom'
      }
    }, {
      id: 'basemap-id-2',
      options: {
        urlTemplate: '',
        category: 'Mapbox'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.basemapsCollection = new BasemapsCollection();

    this.model = new AddBasemapModel({}, {
      layerDefinitionsCollection: {},
      basemapsCollection: this.basemapsCollection,
      customBaselayersCollection: this.customBaselayersCollection,
      currentTab: self._currentTab
    });

    this.view = new AddBasemapView({
      modalModel: new Backbone.Model(),
      layerDefinitionsCollection: {},
      createModel: this.model
    });
    this.view.render();
  });

  it('should render the tabs', function() {
    expect(this.innerHTML()).toContain('XYZ');
  });

  // it('should create view model with map and baselayers', function() {
  //   expect(AddBasemapModel.prototype.initialize).toHaveBeenCalled();
  //   expect(AddBasemapModel.prototype.initialize).toHaveBeenCalledWith(jasmine.objectContaining({ map: this.map }));
  //   expect(AddBasemapModel.prototype.initialize).toHaveBeenCalledWith(jasmine.objectContaining({ baseLayers: this.baseLayers }));
  // });

  // it('should start on XYZ view', function() {
  //   expect(this.innerHTML()).toContain('Insert your XYZ URL');
  // });

  // it('should hilight the selected tab', function() {
  //   expect(this.innerHTML()).toMatch('name="xyz".*is-selected');
  //   expect(this.innerHTML()).not.toMatch('name="wms".*is-selected');
  // });

  // it('should not have any leaks', function() {
  //   expect(this.view).toHaveNoLeaks();
  // });

  // describe('when clicking on a tab', function() {
  //   beforeEach(function() {
  //     this.view.$('button[data-name="wms"]').click();
  //   });

  //   it('should change tab', function() {
  //     expect(this.innerHTML()).toContain('Insert your WMS/WMTS URL');
  //   });

  //   it('should highlight new tab', function() {
  //     expect(this.innerHTML()).toMatch('name="wms".*is-selected');
  //     expect(this.innerHTML()).not.toMatch('name="xyz".*is-selected');
  //   });
  // });

  // describe('when click OK', function() {
  //   beforeEach(function() {
  //     spyOn(this.view.model, 'canSaveBasemap').and.returnValue(true);
  //     spyOn(this.view.model, 'saveBasemap');
  //     this.view.$('.ok').click();
  //   });

  //   it('should save new basemap', function() {
  //     expect(this.view.model.saveBasemap).toHaveBeenCalled();
  //   });

  //   describe('when save succeeds', function() {
  //     beforeEach(function() {
  //       spyOn(this.view, 'close');
  //       this.view.model.set('currentView', 'saveDone');
  //     });

  //     it('should close view', function() {
  //       expect(this.view.close).toHaveBeenCalled();
  //     });
  //   });

  //   describe('when save fails', function() {
  //     beforeEach(function() {
  //       this.view.model.set('currentView', 'saveFail');
  //     });

  //     it('should show an error explanation', function() {
  //       expect(this.innerHTML()).toContain('error');
  //     });
  //   });
  // });

  afterEach(function() {
    this.view.clean();
  });
});
