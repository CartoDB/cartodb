var BasemapFormModel = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemap-form-model');
var BasemapsCollection = require('../../../../../../javascripts/cartodb3/editor/layers/basemap-content-views/basemaps-collection');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../javascripts/cartodb3/data/user-model');
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
      configModel: configModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123'
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

    spyOn(this.formModel._basemapsCollection, 'updateSelected');
    spyOn(this.formModel._layerDefinitionsCollection, 'setBaseLayer');
  });

  describe('when form data changes', function () {
    beforeEach(function () {
      this.formModel.set('color', {
        color: {
          fixed: '#FABADA',
          opacity: 1
        }
      });
    });

    it('should save changes', function () {
      expect(this.formModel._basemapsCollection.updateSelected).toHaveBeenCalledWith('plain');
      expect(this.formModel._layerDefinitionsCollection.setBaseLayer).toHaveBeenCalledWith({
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
        id: null,
        urlTemplate: '',
        subdomains: '',
        minZoom: 0,
        name: '',
        attribution: null,
        labels: null,
        tms: false
      });
    });
  });
});
