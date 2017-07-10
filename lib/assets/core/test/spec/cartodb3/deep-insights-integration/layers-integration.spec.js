
/*

spyOn(DeepInsightsIntegrations.prototype, '_linkLayerErrors'); ???

describe('when a new layer definition model is created', function () {
  beforeEach(function () {
    this.layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'integration-test',
      kind: 'carto',
      options: {
        sql: 'SELECT * FROM bar',
        cartocss: 'CARTO_CSS',
        table_name: 'bar',
        table_name_alias: 'My BAR'
      }
    }, { at: 1 }); // <- this is what actually determines the right order

    this.cartodbjsMap = this.integrations.visMap();
    spyOn(this.cartodbjsMap, 'createCartoDBLayer');
    spyOn(this.cartodbjsMap, 'createTorqueLayer');

    this.cdbjsLayer = new Backbone.Model();
    this.cdbjsLayer.update = jasmine.createSpy('update');
    this.cdbjsLayer.remove = jasmine.createSpy('remove');

    this.integrations.visMap().getLayerById = function (layerId) {
      if (layerId === 'integration-test') {
        return this.cdbjsLayer;
      }
    }.bind(this);
  });

  it('should create the CartoDB.js layer at the given position (order)', function () {
    this.layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'integration-test-2',
      kind: 'carto',
      options: {
        sql: 'SELECT * FROM foo',
        cartocss: 'CARTO_CSS'
      }
    }, { at: 1 }); // <- this is what actually determines the right order

    expect(this.cartodbjsMap.createCartoDBLayer).toHaveBeenCalledWith({
      id: 'integration-test-2',
      sql: 'SELECT * FROM foo',
      cartocss: 'CARTO_CSS',
      order: 1,
      type: 'CartoDB'
    }, {
      at: 1
    });
  });

  it('should update the CartoDB.js layer at the right position', function () {
    var collection = new Backbone.Collection([new Backbone.Model(), this.cdbjsLayer, new Backbone.Model(), new Backbone.Model()]);
    spyOn(this.integrations.visMap(), 'moveCartoDBLayer');
    this.integrations._getLayers.and.returnValue(collection);
    spyOn(this.integrations, '_getLayer').and.returnValue(this.cdbjsLayer);

    this.layerDefinitionsCollection.remove(this.layerDefinitionModel);

    this.layerDefinitionsCollection.add({
      id: 'integration-test-2',
      kind: 'carto',
      options: {
        sql: 'SELECT * FROM foo',
        cartocss: 'CARTO_CSS'
      }
    }, { at: 1 });

    this.layerDefinitionsCollection.add(this.layerDefinitionModel, { at: 2 });

    expect(this.integrations.visMap().moveCartoDBLayer).toHaveBeenCalledWith(1, 2);
  });

  describe('when the layer definition model is updated', function () {
    beforeEach(function () {
      this.layerDefinitionModel.set({
        sql: 'SELECT * FROM bar LIMIT 10',
        cartocss: 'NEW_CARTO_CSS'
      });
    });

    it('should update the CartoDB.js layer', function () {
      expect(this.cdbjsLayer.update).toHaveBeenCalledWith({
        sql: 'SELECT * FROM bar LIMIT 10',
        cartocss: 'NEW_CARTO_CSS',
        source: 'b0'
      });
    });
  });

  describe('when layer type is changed to torque', function () {
    beforeEach(function () {
      this.layerDefinitionModel.set('type', 'torque');
    });

    it('should have re-created the layer', function () {
      expect(this.cdbjsLayer.remove).toHaveBeenCalled();
      expect(this.cartodbjsMap.createTorqueLayer).toHaveBeenCalledWith({
        id: 'integration-test',
        sql: 'SELECT * FROM bar',
        cartocss: 'CARTO_CSS',
        table_name: 'bar',
        table_name_alias: 'My BAR',
        autoStyle: false,
        order: 1,
        source: 'b0',
        type: 'torque',
        layer_name: 'My BAR'
      }, { at: 1 });
    });

    xit("should have created a timeslider widget if there wasn't one", function () {
      expect(this.widgetDefinitionsCollection.where({'type': 'time-series'}).length).not.toBeLessThan(1);
    });
  });

  describe('when layer has a source attribute here and not in CartoDB.js', function () {
    it('should set/update the source attribute', function () {
      // Imagine CartoDB.js returns a layer with no source
      this.cdbjsLayer.set({
        'id': 'integration-test',
        'type': 'CartoDB',
        'order': 1,
        'visible': true,
        'cartocss': 'cartoCSS',
        'cartocss_version': '2.1.1',
        'sql': 'SELECT * FROM test'
      });

      // Change some attributes in the definition model
      this.cdbjsLayer.update.calls.reset();
      this.layerDefinitionModel.set({
        cartocss: 'a different CartoCSS'
      });

      // The CartoDB.js layer has been updated and given a source
      expect(this.cdbjsLayer.update).toHaveBeenCalledWith({
        cartocss: 'a different CartoCSS',
        source: this.layerDefinitionModel.get('source')
      });
    });
  });

  describe('when removing layer', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.remove(this.layerDefinitionModel);
    });

    it('cartodb.js layer should be removed too', function () {
      expect(this.cdbjsLayer.remove).toHaveBeenCalled();
    });
  });
});


describe('when the base layer has changed', function () {
  beforeEach(function () {
    this.layerDefinitionsCollection.reset([
      {
        order: 0,
        id: 'layer-id',
        type: 'Tiled',
        default: true,
        urlTemplate: 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        subdomains: 'abcd',
        minZoom: '0',
        maxZoom: '18',
        name: 'Positron',
        className: 'positron_rainbow_labels',
        attribution: '© <a href=\'http://www.openstreetmap.org/copyright\'>OpenStreetMap</a> contributors © <a href=\'https://carto.com/attributions\'>CARTO</a>'
      }
    ], { parse: false });

    this.cdbjsMap = this.integrations.visMap();
    spyOn(this.cdbjsMap, 'set');
    spyOn(this.cdbjsMap, 'createTileLayer');
    spyOn(this.cdbjsMap, 'createPlainLayer');
    spyOn(this.cdbjsMap, 'createGMapsBaseLayer');

    this.cdbjsLayer = new Backbone.Model();
    this.cdbjsLayer.update = jasmine.createSpy('update');
    this.cdbjsLayer.remove = jasmine.createSpy('remove');

    spyOn(this.cdbjsMap.layers, 'get').and.returnValue(this.cdbjsLayer);
  });

  it('should re-create the cdb.js layer if type has changed', function () {
    this.layerDefinitionsCollection.at(0).attributes = _.pick(this.layerDefinitionsCollection.attributes, 'type');
    this.layerDefinitionsCollection.at(0).set({
      id: 'baseLayer',
      type: 'Plain',
      color: '#FABADA',
      order: 0
    });

    this.layerDefinitionsCollection.trigger('baseLayerChanged');
    expect(this.cdbjsLayer.remove).toHaveBeenCalled();
    expect(this.cdbjsMap.createPlainLayer).toHaveBeenCalledWith({
      id: 'baseLayer',
      type: 'Plain',
      color: '#FABADA',
      order: 0
    }, { at: 0, silent: false });
  });

  it('should update the cdb.js layer if type has NOT changed', function () {
    this.layerDefinitionsCollection.at(0).set({
      urlTemplate: 'newURLTemplate'
    });

    this.layerDefinitionsCollection.trigger('baseLayerChanged');

    expect(this.cdbjsLayer.update).toHaveBeenCalledWith({
      urlTemplate: 'newURLTemplate'
    }, { silent: false });
  });

  it('should change the map provider', function () {
    this.layerDefinitionsCollection.at(0).attributes = _.pick(this.layerDefinitionsCollection.attributes, 'type');
    this.layerDefinitionsCollection.at(0).set({
      name: 'GMaps Hybrid',
      maxZoom: 40,
      minZoom: 0,
      baseType: 'hybrid',
      className: 'googlemaps',
      style: '[]',
      type: 'GMapsBase'
    });

    this.layerDefinitionsCollection.trigger('baseLayerChanged');

    expect(this.cdbjsMap.set).toHaveBeenCalledWith('provider', 'googlemaps');
  });

  describe('if new new base layer has labels', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.resetByLayersData([
        {
          'id': 'baseLayer',
          'options': {
            'type': 'Tiled',
            'urlTemplate': 'urlTemplate'
          },
          'kind': 'tiled',
          'order': 0
        },
        {
          'id': 'labelsLayer',
          'options': {
            'type': 'Tiled',
            'urlTemplate': 'urlTemplate2'
          },
          'kind': 'tiled',
          'order': 1
        }
      ]);

      this.cdbjsLayer = new Backbone.Model({ id: 'baseLayer' });
      this.cdbjsLayer.update = jasmine.createSpy('update');
      this.cdbjsLayer.remove = jasmine.createSpy('remove');
    });

    describe('if cdb.js has a layer with labels', function () {
      beforeEach(function () {
        this.cdbjsLabelsLayer = new Backbone.Model({ type: 'Tiled' });
        this.cdbjsLabelsLayer.update = jasmine.createSpy('update');
        this.cdbjsLabelsLayer.remove = jasmine.createSpy('remove');

        this.integrations._getLayers.and.returnValue(new Backbone.Collection([
          this.cdbjsLayer,
          this.cdbjsLabelsLayer
        ]));

        this.integrations.visMap().getLayerById = function (layerId) {
          if (this.layerDefinitionsCollection.at(0).id === layerId) {
            return this.cdbjsLayer;
          }
          if (this.layerDefinitionsCollection.at(1).id === layerId) {
            return this.cdbjsLabelsLayer;
          }
        }.bind(this);
      });

      it('should update the cdb.js labels layer when something changes', function () {
        this.layerDefinitionsCollection.at(1).set({
          urlTemplate: 'urlTemplate3'
        });
        this.layerDefinitionsCollection.trigger('baseLayerChanged');

        expect(this.cdbjsLabelsLayer.update).toHaveBeenCalledWith({
          urlTemplate: 'urlTemplate3'
        }, { silent: false });
      });
    });

    describe('if cdb.js does NOT have a layer with labels', function () {
      beforeEach(function () {
        this.integrations._getLayers.and.returnValue(new Backbone.Collection([
          this.cdbjsLayer
        ]));

        this.integrations.visMap().getLayerById = function (layerId) {
          if (this.layerDefinitionsCollection.at(0).id === layerId) {
            return this.cdbjsLayer;
          }
        }.bind(this);
      });

      it('should create the cdb.js labels layer', function () {
        this.layerDefinitionsCollection.trigger('baseLayerChanged');

        expect(this.cdbjsMap.createTileLayer).toHaveBeenCalledWith({
          id: 'labelsLayer',
          order: 1,
          type: 'Tiled',
          urlTemplate: 'urlTemplate2'
        }, { at: 1, silent: false });
      });
    });
  });

  describe('if new new base layer does NOT have labels', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.resetByLayersData([
        {
          'id': 'baseLayer',
          'options': {
            'type': 'Tiled',
            'urlTemplate': 'urlTemplate'
          },
          'kind': 'tiled',
          'order': 0
        }
      ]);

      this.cdbjsLayer = new Backbone.Model({ id: 'baseLayer' });
      this.cdbjsLayer.update = jasmine.createSpy('update');
      this.cdbjsLayer.remove = jasmine.createSpy('remove');
    });

    describe('if cdb.js has a layer with labels', function () {
      beforeEach(function () {
        this.cdbjsLabelsLayer = new Backbone.Model({ type: 'Tiled' });
        this.cdbjsLabelsLayer.update = jasmine.createSpy('update');
        this.cdbjsLabelsLayer.remove = jasmine.createSpy('remove');

        this.integrations._getLayers.and.returnValue(new Backbone.Collection([
          this.cdbjsLayer,
          this.cdbjsLabelsLayer
        ]));

        this.integrations.visMap().getLayerById = function (layerId) {
          if (this.layerDefinitionsCollection.at(0).id === layerId) {
            return this.cdbjsLayer;
          }
          if (this.layerDefinitionsCollection.at(1).id === layerId) {
            return this.cdbjsLabelsLayer;
          }
        }.bind(this);
      });

      it('should remove the cdb.js labels layer', function () {
        this.layerDefinitionsCollection.trigger('baseLayerChanged');

        expect(this.cdbjsLabelsLayer.remove).toHaveBeenCalledWith({ silent: false });
      });
    });
  });
});

describe('when a layer is moved', function () {
  it('should invoke moveCartoDBLayer function in CartoDB.js', function () {
    spyOn(this.integrations.visMap(), 'moveCartoDBLayer');
    this.layerDefinitionsCollection.trigger('layerMoved', this.layerDefinitionsCollection.at(0), 0, 1);
    expect(this.integrations.visMap().moveCartoDBLayer).toHaveBeenCalledWith(0, 1);
  });
});

describe('.infowindow', function () {
  beforeEach(function () {
    this.cdbLayer = createFakeLayer({ id: 'layer-id' });
    this.cdbLayer.infowindow = jasmine.createSpyObj('infowindow', ['update']);

    this.layerDefinitionsCollection.resetByLayersData({
      id: 'layer-id',
      kind: 'carto',
      options: {
        table_name: 'infowindow_stuff',
        cartocss: ''
      },
      infowindow: {
        alternative_names: {},
        autoPan: true,
        content: '',
        fields: [],
        headerColor: {},
        latlng: [0, 0],
        maxHeight: 180,
        offset: [28, 0],
        template: '',
        template_name: 'table/views/infowindow_light',
        visibility: false,
        width: 226
      }
    });

    spyOn(DeepInsightsIntegrations.prototype, '_onLegendDefinitionAdded');

    var mapModeModel = new MapModeModel();
    var configModel = new ConfigModel({
      base_url: 'pepito'
    });

    this.integrations2 = new DeepInsightsIntegrations({
      userModel: new Backbone.Model(),
      onboardings: createOnboardings(),
      deepInsightsDashboard: createFakeDashboard([ this.cdbLayer ]),
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      stateDefinitionModel: this.stateDefinitionModel,
      overlayDefinitionsCollection: this.overlaysCollection,
      visDefinitionModel: this.visDefinitionModel,
      mapDefinitionModel: this.mapDefinitionModel,
      editorModel: this.editorModel,
      mapModeModel: mapModeModel,
      configModel: configModel,
      editFeatureOverlay: new Backbone.View()
    });
  });

  it('should not show infowindow', function () {
    expect(this.cdbLayer.infowindow.update).toHaveBeenCalledWith({
      alternative_names: {},
      autoPan: true,
      content: '',
      fields: [],
      headerColor: {},
      latlng: [0, 0],
      maxHeight: 180,
      offset: [28, 0],
      template: '',
      template_name: 'table/views/infowindow_light',
      visibility: false,
      width: 226
    });
  });

  describe('w/o fields', function () {
    beforeEach(function () {
      this.cdbLayer.infowindow.update.calls.reset();
      this.cdbLayer.infowindow = jasmine.createSpyObj('infowindow', ['update']);
    });

    describe('when template is changed', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.at(0).infowindowModel.set({
          'template_name': 'infowindow_light',
          'template': '<div class="CDB-infowindow"></div>'
        });
      });

      xit('should set a "none" template', function () {
        expect(this.cdbLayer.infowindow.update).toHaveBeenCalledWith({
          alternative_names: {},
          autoPan: true,
          content: '',
          fields: [{ name: 'cartodb_id', title: true, position: 0 }],
          headerColor: {},
          latlng: [0, 0],
          maxHeight: 180,
          offset: [28, 0],
          template: '<div class="CDB-infowindow Infowindow-none js-infowindow">\n  <div class="CDB-infowindow-close js-close"></div>\n  <div class="CDB-infowindow-container">\n    <div class="CDB-infowindow-bg">\n      <div class="CDB-infowindow-inner">\n        {{#loading}}\n          <div class="CDB-Loader js-loader is-visible"></div>\n        {{/loading}}\n        <ul class="CDB-infowindow-list">\n          <li class="CDB-infowindow-listItem">\n            <h5 class="CDB-infowindow-subtitle">Select fields</h5>\n            <h4 class="CDB-infowindow-title">You haven’t selected any fields to be shown in the infowindow.</h4>\n          </li>\n        </ul>\n      </div>\n    </div>\n    <div class="CDB-hook">\n      <div class="CDB-hook-inner"></div>\n    </div>\n  </div>\n</div>\n',
          template_name: 'infowindow_light',
          visibility: false,
          width: 226
        });
      });
    });
  });

  describe('w/ fields', function () {
    beforeEach(function () {
      this.layerDefinitionsCollection.at(0).infowindowModel.set({
        'fields': [
          {
            name: 'description',
            title: true,
            position: 0
          },
          {
            name: 'name',
            title: true,
            position: 1
          }
        ]
      });

      this.cdbLayer.infowindow.update.calls.reset();
      this.cdbLayer.infowindow = jasmine.createSpyObj('infowindow', ['update']);
    });

    describe('when template is changed', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.at(0).infowindowModel.set({
          'template_name': 'infowindow_light',
          'template': '<div class="CDB-infowindow"></div>'
        });
      });

      it('should update template', function () {
        expect(this.cdbLayer.infowindow.update).toHaveBeenCalledWith({
          alternative_names: {},
          autoPan: true,
          content: '',
          fields: [
            {
              name: 'description',
              title: true,
              position: 0
            },
            {
              name: 'name',
              title: true,
              position: 1
            }
          ],
          headerColor: {},
          latlng: [0, 0],
          maxHeight: 180,
          offset: [28, 0],
          template_name: 'infowindow_light',
          template: '<div class="CDB-infowindow"></div>',
          visibility: false,
          width: 226
        });
      });
    });

    describe('when both template and fields are changed', function () {
      beforeEach(function () {
        this.layerDefinitionsCollection.at(0).infowindowModel.set({
          'fields': [
            {
              name: 'description',
              title: true,
              position: 1
            },
            {
              name: 'name',
              title: true,
              position: 0
            }
          ],
          'template_name': 'infowindow_dark',
          'template': '<div class="CDB-infowindow CDB-infowindow--dark"></div>'
        });
      });

      it('should update fields and template', function () {
        expect(this.cdbLayer.infowindow.update).toHaveBeenCalledWith({
          alternative_names: {},
          autoPan: true,
          content: '',
          fields: [
            {
              name: 'description',
              title: true,
              position: 1
            },
            {
              name: 'name',
              title: true,
              position: 0
            }
          ],
          headerColor: {},
          latlng: [0, 0],
          maxHeight: 180,
          offset: [28, 0],
          template: '<div class="CDB-infowindow CDB-infowindow--dark"></div>',
          template_name: 'infowindow_dark',
          visibility: false,
          width: 226
        });
      });
    });
  });
});

describe('"syncing" of errors coming from cartodb.js models', function () {
  beforeEach(function () {
    this.cdbLayer = createFakeLayer({
      id: 'layer-id',
      error: {
        type: 'turbo-carto',
        context: {
          source: {
            start: {
              line: 99
            }
          }
        },
        message: 'something went wrong'
      }
    });
    this.cdbLayer.infowindow = jasmine.createSpyObj('infowindow', ['update']);

    this.layerDefinitionsCollection.resetByLayersData({
      id: 'layer-id',
      kind: 'carto',
      options: {
        table_name: 'infowindow_stuff',
        cartocss: ''
      },
      infowindow: {
        alternative_names: {},
        autoPan: true,
        content: '',
        fields: [],
        headerColor: {},
        latlng: [0, 0],
        maxHeight: 180,
        offset: [28, 0],
        template: '',
        template_name: 'table/views/infowindow_light',
        visibility: false,
        width: 226
      }
    });

    spyOn(DeepInsightsIntegrations.prototype, '_onLegendDefinitionAdded');

    var mapModeModel = new MapModeModel();
    var configModel = new ConfigModel({
      base_url: 'pepito'
    });

    this.integrations2 = new DeepInsightsIntegrations({
      userModel: new Backbone.Model(),
      onboardings: createOnboardings(),
      deepInsightsDashboard: createFakeDashboard([ this.cdbLayer ]),
      analysisDefinitionsCollection: this.analysisDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      widgetDefinitionsCollection: this.widgetDefinitionsCollection,
      stateDefinitionModel: this.stateDefinitionModel,
      overlayDefinitionsCollection: this.overlaysCollection,
      visDefinitionModel: this.visDefinitionModel,
      mapDefinitionModel: this.mapDefinitionModel,
      editorModel: this.editorModel,
      mapModeModel: mapModeModel,
      configModel: configModel,
      editFeatureOverlay: new Backbone.View()
    });
  });

  it('should set turbo-carto errors on the layerDefinitionModel if CartoDB.js layer had an error', function () {
    expect(this.layerDefinitionsCollection.at(0).get('error')).toEqual({
      type: 'turbo-carto',
      line: 99,
      message: 'something went wrong'
    });
  });

  it('should set turbo-carto errors on the layerDefinitionModel if CartoDB.js layer gets new errors', function () {
    this.cdbLayer.set('error', {
      type: 'turbo-carto',
      context: {
        source: {
          start: {
            line: 199
          }
        }
      },
      message: 'something went totally wrong'
    });

    expect(this.layerDefinitionsCollection.at(0).get('error')).toEqual({
      type: 'turbo-carto',
      line: 199,
      message: 'something went totally wrong'
    });
  });

  it('should add an error in the notifier with the same id as the layer', function () {
    var notifications = Notifier.getCollection();
    var notification = notifications.pop();
    expect(notification.id).toBe('layer-id');
    expect(notification.get('status')).toBe('error');
    expect(notification.get('info')).toBe('infowindow_stuff: something went wrong');
  });
});


describe('when the style is changed', function () {
  it("should disable any activated widgets' autoStyle", function () {
    this.a0 = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * FROM foobar'
      }
    });

    var layerDefinitionModel = this.layerDefinitionsCollection.add({
      id: 'integration-test',
      kind: 'carto',
      options: {
        table_name: 'something',
        source: 'a0',
        cartocss: ''
      }
    });

    var nodeDef = layerDefinitionModel.getAnalysisDefinitionNodeModel();
    nodeDef.queryGeometryModel.set('simple_geom', 'point');
    spyOn(layerDefinitionModel, 'save');

    var model = this.widgetDefinitionsCollection.add({
      id: 'w-100',
      type: 'category',
      title: 'test',
      layer_id: 'integration-test',
      options: {
        column: 'col'
      },
      source: {
        id: 'a0'
      }
    });
    model.trigger('sync', model);
    var widgetModel = dashBoard.getWidgets()[0];
    widgetModel.set('autoStyle', true);
    layerDefinitionModel.set('cartocss', 'differentCartocss');
    document.body.removeChild(document.getElementsByClassName('CDB-Widget-tooltip')[0]);
    expect(widgetModel.get('autoStyle')).toBe(false);
  });
});

describe('_resetStylesIfNoneApplied', function () {
  beforeEach(function () {
    this.layerDefModel = new LayerDefinitionModel({
      id: 'harr',
      kind: 'carto',
      options: {
        sql: 'SELECT * FROM fooo',
        table_name: 'fooo',
        cartocss: '...',
        source: 'd1',
        style_properties: {
          type: 'none',
          properties: {}
        }
      }
    }, { parse: true, configModel: 'c' });
    this.layerDefinitionsCollection.add(this.layerDefModel, { silent: true });

    this.d0 = this.analysisDefinitionNodesCollection.add({
      id: 'd0',
      type: 'source',
      params: {
        query: 'SELECT * FROM foobar'
      }
    });

    this.d1 = this.analysisDefinitionsCollection.add({
      analysis_definition: {
        id: 'd1',
        type: 'buffer',
        params: {
          radius: 10,
          source: this.d0.toJSON()
        }
      }
    });

    var nodeMod = this.analysis._analysisCollection.at(1);
    spyOn(nodeMod, 'isDone');
    var nodeDef = this.layerDefModel.getAnalysisDefinitionNodeModel();
    nodeDef.queryGeometryModel.set('simple_geom', 'point', { silent: true });
    spyOn(this.layerDefModel.styleModel, 'setDefaultPropertiesByType').and.callThrough();
  });

  it('should not reset styles if layer doesn\'t have none styles', function () {
    this.layerDefModel.styleModel.set('type', 'simple', { silent: true });
    this.integrations._resetStylesIfNoneApplied(this.layerDefModel);
    expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
  });

  it('should not reset styles if node definition has not finished', function () {
    var nodeMod = this.analysis._analysisCollection.at(1);
    nodeMod.isDone.and.returnValue(false);
    this.integrations._resetStylesIfNoneApplied(this.layerDefModel);
    expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
  });

  it('should not reset styles if node type is source', function () {
    var nodeMod = this.analysis._analysisCollection.at(1);
    nodeMod.set('type', 'source');
    this.integrations._resetStylesIfNoneApplied(this.layerDefModel);
    expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
  });

  it('should fetch geometry if it is not defined until reset styles', function () {
    var nodeDef = this.layerDefModel.getAnalysisDefinitionNodeModel();
    var nodeMod = this.analysis._analysisCollection.at(1);
    nodeDef.queryGeometryModel.set('simple_geom', '', { silent: true });
    nodeMod.isDone.and.returnValue(true);
    spyOn(nodeDef.queryGeometryModel, 'fetch').and.callFake(function () {
      nodeDef.queryGeometryModel.set('simple_geom', 'polygon', { silent: true });
    });

    this.integrations._resetStylesIfNoneApplied(this.layerDefModel);
    expect(nodeDef.queryGeometryModel.fetch).toHaveBeenCalled();
    expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).not.toHaveBeenCalled();
  });

  it('should reset styles if layer has none styles', function () {
    var nodeMod = this.analysis._analysisCollection.at(1);
    nodeMod.isDone.and.returnValue(true);
    expect(this.layerDefModel.styleModel.hasNoneStyles()).toBeTruthy();
    this.integrations._resetStylesIfNoneApplied(this.layerDefModel);
    expect(this.layerDefModel.styleModel.setDefaultPropertiesByType).toHaveBeenCalled();
    expect(this.layerDefModel.styleModel.hasNoneStyles()).toBeFalsy();
  });
});


*/

/*
describe('time series', function () {
  var xhrSpy = jasmine.createSpyObj('xhr', ['abort', 'always', 'fail']);

  var cartocss = 'Map {-torque-frame-count: 256;-torque-animation-duration: 30;-torque-time-attribute: cartodb_id";-torque-aggregation-function: "count(1)";-torque-resolution: 4;-torque-data-aggregation: linear;} #layer {}, #layer[frame-offset=1] {marker-width: 9; marker-fill-opacity: 0.45;} #layer[frame-offset=2] {marker-width: 11; marker-fill-opacity: 0.225;}';

  var animatedChanged1 = {attribute: 'cartodb_id', duration: 24, overlap: false, resolution: 4, steps: 256, trails: 2};
  var animatedChanged2 = {attribute: 'cartodb_id', duration: 24, overlap: false, resolution: 4, steps: 256, trails: 3};

  beforeEach(function () {
    spyOn(Backbone.Model.prototype, 'sync').and.returnValue(xhrSpy);

    this.layerDefModel = new LayerDefinitionModel({
      id: 'wadus',
      kind: 'torque',
      options: {
        tile_style: cartocss,
        query: 'SELECT * FROM fooo',
        table_name: 'fooo',
        source: 'd0',
        style_properties: {
          type: 'animation',
          properties: {
            animated: {
              attribute: 'cartodb_id',
              duration: 30,
              overlap: false,
              resolution: 4,
              steps: 256,
              trails: 2
            }
          }
        }
      }
    }, { parse: true, configModel: 'c' });

    this.layerDefinitionsCollection.add(this.layerDefModel);

    this.d0 = this.analysisDefinitionNodesCollection.add({
      id: 'd0',
      type: 'source',
      params: {
        query: 'SELECT * FROM fooo'
      }
    });

    // We have to add the analysis and the layer manually due to in this class
    // there is no bindings for those purposes (layers-integration will have it)
    var visMap = this.diDashboardHelpers.visMap();
    var attrs = this.layerDefModel.toJSON();
    attrs.source = 'd0';
    attrs.cartocss = attrs.options.tile_style;
    visMap.createTorqueLayer(attrs, _.extend({
      at: 0
    }));
    var nodeMod = this.diDashboardHelpers.getAnalyses().analyse(this.d0.toJSON());

    spyOn(nodeMod, 'isDone');
  });

  it('should create time-series widget on layer changes', function () {
    var l = this.diDashboardHelpers.getLayer(this.layerDefModel.id);
    spyOn(this.integration, '_createTimeseries').and.callThrough();

    expect(l).toBeDefined();
    this.layerDefModel.styleModel.set({animated: animatedChanged1});
    this.layerDefModel.set({alias: 'wadus'});

    expect(this.integration._createTimeseries).toHaveBeenCalled();
  });

  it('should create only one time-series widget', function () {
    spyOn(this.integration, '_createTimeseries').and.callThrough();
    this.layerDefModel.styleModel.set({animated: animatedChanged1});
    this.layerDefModel.set({alias: 'wadus'});

    expect(this.integration._createTimeseries).toHaveBeenCalled();

    Backbone.Model.prototype.sync.calls.argsFor(0)[2].error({
      error: 'abort'
    });

    this.layerDefModel.styleModel.set({animated: animatedChanged2});
    this.layerDefModel.set({alias: 'wadus wadus'});

    expect(this.integration._createTimeseries).toHaveBeenCalled();

    Backbone.Model.prototype.sync.calls.argsFor(0)[2].success({
      id: '1',
      layer_id: 'wadus',
      options: {
        column: 'cartodb_id',
        bins: 256,
        animated: true,
        sync_on_data_change: true,
        sync_on_bbox_change: true
      },
      order: 0,
      source: {
        id: 'a0'
      },
      style: {
        widget_style: {
          definition: {
            color: {
              fixed: '#F2CC8F',
              opacity: 1
            }
          }
        }
      },
      title: 'time_date__t',
      type: 'time-series'
    });

    expect(this.widgetDefinitionsCollection.length).toBe(1);
  });
});
*/
