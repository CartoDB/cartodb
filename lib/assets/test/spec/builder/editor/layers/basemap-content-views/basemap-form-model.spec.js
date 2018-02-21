var BasemapFormModel = require('builder/editor/layers/basemap-content-views/basemap-form-model');
var BasemapsCollection = require('builder/editor/layers/basemap-content-views/basemaps-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var _ = require('underscore');

describe('editor/layers/basemap-content-views/basemap-form-model', function () {
  beforeEach(function () {
    spyOn(_, 'debounce').and.callFake(function (func) {
      return function () {
        func.apply(this, arguments);
      };
    });

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
        table_name: 'foo'
      }
    });
    this.basemapsCollection = new BasemapsCollection();
    this.basemapsCollection.add({
      default: false,
      color: '#35AAE5',
      image: '',
      maxZoom: 32,
      className: 'plain',
      category: 'Color',
      type: 'Plain',
      selected: true,
      val: 'plain',
      label: 'plain',
      template: 'plain'
    });

    this.formModel = new BasemapFormModel({
      color: {
        color: {
          fixed: '#35AAE5',
          opacity: 1
        }
      },
      image: ''
    }, {
      basemapsCollection: this.basemapsCollection,
      layerDefinitionsCollection: this.layerDefinitionsCollection
    });

    spyOn(this.basemapsCollection, 'updateSelected');
    spyOn(this.layerDefinitionsCollection, 'setBaseLayer');
  });

  describe('when form data changes', function () {
    beforeEach(function () {
      this._setColor = function () {
        this.formModel.set('color', {
          color: {
            fixed: '#FABADA',
            opacity: 1
          }
        });
      }.bind(this);
    });

    it('should save changes if it is already selected', function () {
      this.basemapsCollection.at(0).set('selected', true);

      this._setColor();

      expect(this.basemapsCollection.updateSelected).not.toHaveBeenCalled();
      expect(this.layerDefinitionsCollection.setBaseLayer).toHaveBeenCalledWith({
        default: false,
        color: '#FABADA',
        image: '',
        maxZoom: 32,
        className: 'plain',
        category: 'Color',
        type: 'Plain',
        selected: true,
        val: 'plain',
        label: 'plain',
        template: 'plain',
        minZoom: 0,
        name: ''
      });
    });

    it('should not save changes if it is not selected', function () {
      this.basemapsCollection.at(0).set('selected', false);

      this._setColor();

      expect(this.basemapsCollection.updateSelected).toHaveBeenCalledWith('plain');
      expect(this.layerDefinitionsCollection.setBaseLayer).not.toHaveBeenCalled();
    });
  });
});
