var AddBasemapModel = require('builder/components/modals/add-basemap/add-basemap-model');
var BasemapsCollection = require('builder/editor/layers/basemap-content-views/basemaps-collection');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var CustomBaselayerModel = require('builder/data/custom-baselayer-model');

describe('components/modals/add-basemap/add-basemap-model', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
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
        urlTemplate: 'https://a.example.com/{z}/{x}/{y}.png',
        category: 'Custom',
        className: 'httpsaexamplecomzxypng'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new AddBasemapModel({}, {
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemapsCollection: new BasemapsCollection([{
        id: 'basemap-id-1',
        urlTemplate: 'https://a.example.com/{z}/{x}/{y}.png',
        val: 'httpsaexamplecomzxypng'
      }]),
      customBaselayersCollection: this.customBaselayersCollection
    });
  });

  it('should start with tabs for current view', function () {
    expect(this.model.get('contentPane')).toEqual('tabs');
  });

  it('should start on XYZ tab', function () {
    expect(this.model.get('currentTab')).toEqual('xyz');
  });

  describe('.activeTabModel', function () {
    it('should return the model for current tab', function () {
      expect(this.model.activeTabModel()).toEqual(jasmine.any(Object));
    });
  });

  describe('.canSaveBasemap', function () {
    it('should return true if there is a layer set on current tab model and is not processing something', function () {
      expect(this.model.canSaveBasemap()).toBeFalsy();

      this.model.activeTabModel().set('layer', {});
      expect(this.model.canSaveBasemap()).toBeTruthy();

      this.model.set('contentPane', 'not tabs');
      expect(this.model.canSaveBasemap()).toBeFalsy();
    });
  });

  describe('.saveBasemap', function () {
    beforeEach(function () {
      var url = 'https://b.example.com/{z}/{x}/{y}.png';

      this.layer = new CustomBaselayerModel({
        id: 'basemap-id-2',
        urlTemplate: url,
        attribution: null,
        maxZoom: 21,
        minZoom: 0,
        name: '',
        tms: false,
        category: 'Custom',
        type: 'Tiled'
      });
      this.layer.set('className', this.layer._generateClassName(url));
      spyOn(this.layer, 'save');
      this.model.activeTabModel().set('layer', this.layer);
    });

    describe('when layer has already been added', function () {
      beforeEach(function () {
        this.model._basemapsCollection.add({
          id: 'basemap-id-2',
          urlTemplate: 'https://b.example.com/{z}/{x}/{y}.png',
          val: 'httpsbexamplecomzxypng'
        });
        this.customBaselayersCollection.add(this.layer);
        spyOn(this.model.activeTabModel(), 'hasAlreadyAddedLayer').and.returnValue(true);
        spyOn(this.model._layerDefinitionsCollection, 'setBaseLayer');
        spyOn(this.model._basemapsCollection, 'updateSelected');
        this.model.saveBasemap();
      });

      it('should call hasAlreadyAddedLayer with baseLayers', function () {
        expect(this.model.activeTabModel().hasAlreadyAddedLayer).toHaveBeenCalledWith(this.customBaselayersCollection);
      });

      it('should change baseLayer', function () {
        expect(this.model._layerDefinitionsCollection.setBaseLayer).toHaveBeenCalledWith({
          id: 'basemap-id-2',
          className: 'httpsbexamplecomzxypng',
          urlTemplate: 'https://b.example.com/{z}/{x}/{y}.png',
          attribution: null,
          maxZoom: 21,
          minZoom: 0,
          name: '',
          tms: false,
          category: 'Custom',
          type: 'Tiled'
        });
      });

      it('should update selected in basemapsCollection', function () {
        expect(this.model._basemapsCollection.updateSelected).toHaveBeenCalledWith('httpsbexamplecomzxypng');
      });
    });

    describe('when layer is new', function () {
      beforeEach(function () {
        spyOn(this.model._layerDefinitionsCollection, 'setBaseLayer');
        spyOn(this.model._basemapsCollection, 'updateSelected');
        this.model.saveBasemap();
      });

      it('should add layer to baselayers', function () {
        expect(this.customBaselayersCollection.contains(this.layer)).toBeTruthy();
      });

      it('should call save on layer', function () {
        expect(this.layer.save).toHaveBeenCalled();
      });

      describe('when save succeeds', function () {
        beforeEach(function () {
          this.layer.save.calls.argsFor(0)[1].success({}, {
            options: {
              urlTemplate: 'https://b.example.com/{z}/{x}/{y}.png',
              attribution: null,
              maxZoom: 21,
              minZoom: 0,
              name: '',
              tms: false,
              category: 'Custom',
              type: 'Tiled',
              className: 'httpsbexamplecomzxypng'
            },
            kind: 'tiled',
            infowindow: null,
            tooltip: null,
            id: 'basemap-id-2',
            order: 2
          });
        });

        it('should change baseLayer', function () {
          expect(this.model._layerDefinitionsCollection.setBaseLayer).toHaveBeenCalledWith({
            id: 'basemap-id-2',
            className: 'httpsbexamplecomzxypng',
            urlTemplate: 'https://b.example.com/{z}/{x}/{y}.png',
            attribution: null,
            maxZoom: 21,
            minZoom: 0,
            name: '',
            tms: false,
            category: 'Custom',
            type: 'Tiled'
          });
        });
      });

      describe('when save fails', function () {
        beforeEach(function () {
          this.layer.save.calls.argsFor(0)[1].error();
        });

        it('should remove layer from baselayers', function () {
          expect(this.customBaselayersCollection.contains(this.layer)).toBeFalsy();
        });

        it('should set current view to addBasemapFailed', function () {
          expect(this.model.get('contentPane')).toEqual('addBasemapFailed');
        });
      });
    });
  });
});
