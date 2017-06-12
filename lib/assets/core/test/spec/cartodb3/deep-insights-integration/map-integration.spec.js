var _ = require('underscore');
var Backbone = require('backbone');

describe('deep-insights-integrations/map-integration', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

    // Dashboard helpers generation


    // Models generation
    var configModel = new ConfigModel({
      base_url: 'pepito'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.editorModel = new Backbone.Model({
      settings: false
    });

    this.visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: configModel
    });

    this.stateDefinitionModel = new StateDefinitionModel({
      json: {
        map: {
          zoom: 10
        }
      }
    }, { visDefinitionModel: this.visDefinitionModel });
    spyOn(this.stateDefinitionModel, 'updateState');

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'map-123',
      stateDefinitionModel: this.stateDefinitionModel
    });

    this.layerDefinitionsCollection.resetByLayersData(layersData);

    this.mapDefinitionModel = new MapDefinitionModel({
      scrollwheel: false
    }, {
      parse: true,
      configModel: configModel,
      userModel: userModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });

    // Track map integration
    MapIntegration.track({
      diDashboardHelpers: diDashboardHelpers,
      editorModel: this.editorModel,
      mapDefinitionModel: this.mapDefinitionModel,
      stateDefinitionModel: this.stateDefinitionModel,
      visDefinitionModel: this.visDefinitionModel
    });

    // Ready steady go!
  });

  it('mapViewSizeChanged', function () {
    var map = this.integrations.visMap();
    spyOn(map, 'getMapViewSize').and.returnValue({
      x: 120,
      y: 133
    });

    spyOn(this.mapDefinitionModel, 'setMapViewSize').and.callThrough();

    map.trigger('mapViewSizeChanged');
    expect(this.mapDefinitionModel.setMapViewSize).toHaveBeenCalled();
    expect(this.mapDefinitionModel.getMapViewSize()).toEqual({
      x: 120,
      y: 133
    });
  });

  it('should set converters when basemap changes', function () {
    spyOn(this.mapDefinitionModel, 'setConverters');

    this.layerDefinitionsCollection.trigger('baseLayerChanged');
    expect(this.mapDefinitionModel.setConverters).toHaveBeenCalled();
  });

  describe('when vis reloads', function () {
    it('should increment changes', function () {
      this.integrations._vis().trigger('reload');
      expect(this.visDefinitionModel.get('visChanges')).toBe(1);
    });
  });

  describe('visMetadata', function () {
    beforeEach(function () {
      spyOn(this.mapDefinitionModel, 'setImageExportMetadata');
      spyOn(this.mapDefinitionModel, 'setStaticImageURLTemplate');
    });

    it('should update vis metadata when state changes', function () {
      this.integrations._diDashboard._dashboard.vis.trigger('dataviewsFetched');
      this.integrations.visMap().set('center', [10, 20]);
      expect(this.mapDefinitionModel.setImageExportMetadata).toHaveBeenCalled();
      expect(this.mapDefinitionModel.setStaticImageURLTemplate).toHaveBeenCalled();
    });

    it('update vis metadata when vis reload', function () {
      this.integrations._vis().trigger('reload');
      expect(this.mapDefinitionModel.setImageExportMetadata).toHaveBeenCalled();
      expect(this.mapDefinitionModel.setStaticImageURLTemplate).toHaveBeenCalled();
    });
  });

  describe('max/min zoom changes', function () {
    beforeEach(function () {
      this.integrations.visMap().set({
        minZoom: 1,
        maxZoom: 20,
        zoom: 12
      });
      this.mapDefinitionModel.set({
        minZoom: 0,
        maxZoom: 15
      });
      // Avoid HTTP requests setting img src to nothing
      dashBoard._dashboard.dashboardView.$('img').attr('src', '');
    });

    it('should change max and min zoom of the map if changes in map-definition-model', function () {
      expect(this.integrations.visMap().get('minZoom')).toBe(0);
      expect(this.integrations.visMap().get('maxZoom')).toBe(15);
    });

    it('should change map zoom if maxZoom is not as high as the current one', function () {
      expect(this.integrations.visMap().get('zoom')).toBe(12);
      this.mapDefinitionModel.set({
        minZoom: 0,
        maxZoom: 9
      });
      // Avoid HTTP requests setting img src to nothing
      dashBoard._dashboard.dashboardView.$('img').attr('src', '');
      expect(this.integrations.visMap().get('zoom')).toBe(9);
    });
  });
});
