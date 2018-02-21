var _ = require('underscore');
var Backbone = require('backbone');
var LegendBaseTypeView = require('builder/editor/layers/layer-content-views/legend/legend-base-type-view');
var MapDefinitionModel = require('builder/data/map-definition-model');
var LegendDefinitionsCollection = require('builder/data/legends/legend-definitions-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var LayerContentModel = require('builder/data/layer-content-model');
var FactoryModals = require('../../../../factories/modals');

describe('editor/layers/layer-content-view/legend/legend-base-type-view', function () {
  var view;

  var configModel = new ConfigModel({
    base_url: '/u/wadus'
  });

  var userModel = new UserModel({
    username: 'foo',
    google_maps_api_key: 123456
  }, {
    configModel: configModel
  });

  var mapDefinitionModel = new MapDefinitionModel({
    scrollwheel: false
  }, {
    parse: true,
    configModel: configModel,
    userModel: userModel,
    layerDefinitionsCollection: new Backbone.Collection()
  });

  var layerDefModel = new LayerDefinitionModel({
    id: 'layerA',
    type: 'cartoDB',
    letter: 'a',
    source: 'a0'
  }, {
    configModel: configModel
  });

  var editorModel = new Backbone.Model();

  editorModel.isEditing = function () {
    return false;
  };

  editorModel.isDisabled = function () {
    return false;
  };

  var layerContentModel = new LayerContentModel({}, {
    querySchemaModel: new Backbone.Model(),
    queryGeometryModel: new Backbone.Model(),
    queryRowsCollection: new Backbone.Collection()
  });

  var legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
    configModel: configModel,
    layerDefinitionsCollection: new Backbone.Collection(),
    vizId: 'v-123'
  });

  var viewOptions = {
    mapDefinitionModel: mapDefinitionModel,
    configModel: configModel,
    userModel: userModel,
    layerDefinitionModel: layerDefModel,
    editorModel: editorModel,
    layerContentModel: layerContentModel,
    legendDefinitionsCollection: legendDefinitionsCollection,
    type: 'I dunno lol',
    userActions: {},
    modals: FactoryModals.createModalService(),
    overlayModel: new Backbone.Model(),
    infoboxModel: new Backbone.Model()
  };

  var createViewFn = function (options) {
    return new LegendBaseTypeView(_.extend({}, viewOptions, options));
  };

  view = createViewFn();

  describe('_initBinds', function () {
    beforeEach(function () {
      spyOn(LegendBaseTypeView.prototype, '_infoboxState');
      spyOn(LegendBaseTypeView.prototype, '_onChangeEdition');
      spyOn(LegendBaseTypeView.prototype, '_onChangeDisabled');
      spyOn(LegendBaseTypeView.prototype, '_onTogglerChanged');
      spyOn(LegendBaseTypeView.prototype, '_toggleOverlay');

      view._initBinds();
    });

    it('should call _infoboxState on layerContentModel change:state', function () {
      view._layerContentModel.set('state', 'wadus');
      expect(view._infoboxState).toHaveBeenCalled();
    });

    it('should call _infoboxState on _layerDefinitionModel change:visible', function () {
      view._layerDefinitionModel.set('visible', false);
      expect(view._infoboxState).toHaveBeenCalled();
    });

    it('should call _infoboxState on _mapDefinitionModel change:legends', function () {
      view._mapDefinitionModel.set('legends', {});
      expect(view._infoboxState).toHaveBeenCalled();
    });

    it('should call _onChangeEdition on _editorModel change:edition', function () {
      view._editorModel.set('edition', true);
      expect(view._onChangeEdition).toHaveBeenCalled();
    });

    it('should call _onChangeDisabled on _editorModel change:disabled', function () {
      view._editorModel.set('disabled', false);
      expect(view._onChangeDisabled).toHaveBeenCalled();
    });

    it('should call _onTogglerChanged on _togglerModel change:active', function () {
      view._togglerModel.set('active', true);
      expect(view._onTogglerChanged).toHaveBeenCalled();
    });

    it('should call _toggleOverlay on _overlayModel change:visible', function () {
      view._overlayModel.set('visible', false);
      expect(view._toggleOverlay).toHaveBeenCalled();
    });
  });
});
