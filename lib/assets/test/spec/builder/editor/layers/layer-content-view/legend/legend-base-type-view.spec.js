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
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/wadus'
    });

    this.userModel = new UserModel({
      username: 'foo',
      google_maps_api_key: 123456
    }, {
      configModel: this.configModel
    });

    this.mapDefinitionModel = new MapDefinitionModel({
      scrollwheel: false
    }, {
      parse: true,
      configModel: this.configModel,
      userModel: this.userModel,
      layerDefinitionsCollection: new Backbone.Collection()
    });

    this.layerDefModel = new LayerDefinitionModel({
      id: 'layerA',
      type: 'cartoDB',
      letter: 'a',
      source: 'a0'
    }, {
      configModel: this.configModel
    });

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () {
      return false;
    };
    this.editorModel.isDisabled = function () {
      return false;
    };

    var querySchemaModel = new Backbone.Model();
    querySchemaModel.hasRepeatedErrors = function () { return false; };

    var queryGeometryModel = new Backbone.Model();
    queryGeometryModel.hasRepeatedErrors = function () { return false; };

    var queryRowsCollection = new Backbone.Collection();
    queryRowsCollection.hasRepeatedErrors = function () { return false; };

    var layerContentModel = new LayerContentModel({}, {
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection
    });

    this.legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
      configModel: this.configModel,
      layerDefinitionsCollection: new Backbone.Collection(),
      vizId: 'v-123'
    });

    this.view = new LegendBaseTypeView({
      mapDefinitionModel: this.mapDefinitionModel,
      userModel: this.userModel,
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefModel,
      editorModel: this.editorModel,
      layerContentModel: layerContentModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      type: 'I dunno lol',
      userActions: {},
      modals: FactoryModals.createModalService(),
      overlayModel: new Backbone.Model(),
      infoboxModel: new Backbone.Model()
    });

    spyOn(this.view, '_infoboxState');
    spyOn(this.view, '_onChangeEdition');
    spyOn(this.view, '_onChangeDisabled');
    spyOn(this.view, '_onTogglerChanged');
    spyOn(this.view, '_toggleOverlay');
  });

  it('_initBinds', function () {
    this.view._initBinds();

    this.view._layerContentModel.set('state', 'wadus');
    expect(this.view._infoboxState).toHaveBeenCalled();

    this.view._layerDefinitionModel.set('visible', false);
    expect(this.view._infoboxState).toHaveBeenCalled();

    this.view._mapDefinitionModel.set('legends', {});
    expect(this.view._infoboxState).toHaveBeenCalled();

    this.view._editorModel.set('edition', true);
    expect(this.view._onChangeEdition).toHaveBeenCalled();

    this.view._editorModel.set('disabled', false);
    expect(this.view._onChangeDisabled).toHaveBeenCalled();

    this.view._togglerModel.set('active', true);
    expect(this.view._onTogglerChanged).toHaveBeenCalled();

    this.view._overlayModel.set('visible', true);
    expect(this.view._toggleOverlay).toHaveBeenCalled();
  });
});
