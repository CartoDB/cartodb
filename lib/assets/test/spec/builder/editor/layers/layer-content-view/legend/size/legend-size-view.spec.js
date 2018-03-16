var _ = require('underscore');
var Backbone = require('backbone');
var LegendSizeView = require('builder/editor/layers/layer-content-views/legend/size/legend-size-view');
var LayerContentModel = require('builder/data/layer-content-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var LegendDefinitionsCollection = require('builder/data/legends/legend-definitions-collection');
var LegendBaseDefinitionModel = require('builder/data/legends/legend-base-definition-model');
var LegendCustomDefinitionModel = require('builder/data/legends/legend-custom-definition-model');
var LegendFactory = require('builder/editor/layers/layer-content-views/legend/legend-factory');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var FactoryModals = require('../../../../../factories/modals');
var MetricsTracker = require('builder/components/metrics/metrics-tracker');

describe('editor/layers/layer-content-view/legend/size/legend-size-view', function () {
  beforeEach(function () {
    spyOn(MetricsTracker, 'track');

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.mapDefModel = new Backbone.Model({
      legends: true
    });
    spyOn(this.mapDefModel, 'save');

    this.userActions = {
      saveLayer: jasmine.createSpy('saveLayer')
    };

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      fetched: true,
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a0'
      }
    }, {
      parse: true,
      configModel: this.configModel
    });

    this.layerDefinitionsCollection = new Backbone.Collection();
    this.layerDefinitionsCollection.add(this.layerDefinitionModel);

    this.legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
      configModel: this.configModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      vizId: 'v-123'
    });

    LegendFactory.init(this.legendDefinitionsCollection);

    this.editorModel = new Backbone.Model({
      edition: false
    });
    this.editorModel.isEditing = function () { return false; };
    this.editorModel.isDisabled = function () { return false; };

    this.htmlModel = new Backbone.Model();

    var querySchemaModel = new Backbone.Model();
    querySchemaModel.hasRepeatedErrors = function () { return false; };

    var queryGeometryModel = new Backbone.Model();
    queryGeometryModel.hasRepeatedErrors = function () { return false; };

    var queryRowsCollection = new Backbone.Collection();
    queryRowsCollection.hasRepeatedErrors = function () { return false; };

    this.layerContentModel = new LayerContentModel({}, {
      querySchemaModel: querySchemaModel,
      queryGeometryModel: queryGeometryModel,
      queryRowsCollection: queryRowsCollection
    });

    this.view = new LegendSizeView({
      userActions: this.userActions,
      editorModel: this.editorModel,
      mapDefinitionModel: this.mapDefModel,
      layerContentModel: this.layerContentModel,
      layerDefinitionModel: this.layerDefinitionModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      type: 'size',
      userModel: this.userModel,
      configModel: this.configModel,
      modals: FactoryModals.createModalService(),
      infoboxModel: new Backbone.Model(),
      overlayModel: new Backbone.Model()
    });
  });

  describe('.render', function () {
    it('should render properly', function () {
      this.view.render();

      expect(_.size(this.view._subviews)).toBe(1); // [PanelWithOptionsView]
      expect(this.view.$('.Infobox').length).toBe(0);
    });

    it('should render custom html legend infobox properly', function () {
      this.legendDefinitionsCollection.add(new LegendCustomDefinitionModel({
        html: '<ul><li>Foo</li></ul>'
      }, {
        layerDefinitionModel: this.layerDefinitionModel,
        configModel: this.configModel,
        vizId: 'v-123'
      }));
      this.view._legendDefinitionModel = this.legendDefinitionsCollection.at(0);
      this.view._infoboxState();
      this.view.render();

      expect(this.view.$('.Infobox').length).toBe(1);
      expect(this.view.$('.Infobox').html()).toContain('editor.legend.messages.custom-legend.body');
    });

    it('should render hidden layer infobox properly', function () {
      this.layerDefinitionModel.set({visible: false});
      this.view.render();

      expect(this.view.$('.Infobox').length).toBe(1);
      expect(this.view.$('.Infobox').html()).toContain('editor.messages.layer-hidden.body');
    });

    it('should render legends-disabled infobox properly', function () {
      this.mapDefModel.set({legends: false});
      this.view.render();

      expect(this.view.$('.Infobox').length).toBe(1);
      expect(this.view.$('.Infobox').html()).toContain('editor.legend.messages.legends-disabled.body');

      this.view.$('.Infobox .js-action').click();
      expect(this.mapDefModel.save).toHaveBeenCalled();
    });
  });

  describe('._initBinds', function () {
    it('should call ._infoboxState when layerContentModel:state changes', function () {
      spyOn(this.view, '_infoboxState');

      this.view._initBinds();
      this.view._layerContentModel.trigger('change:state');

      expect(this.view._infoboxState).toHaveBeenCalled();
    });

    it('should call ._infoboxState when _layerDefinitionModel:visible changes', function () {
      spyOn(this.view, '_infoboxState');

      this.view._initBinds();
      this.view._layerDefinitionModel.trigger('change:visible');

      expect(this.view._infoboxState).toHaveBeenCalled();
    });

    it('should call ._infoboxState when _mapDefinitionModel:legends changes', function () {
      spyOn(this.view, '_infoboxState');

      this.view._initBinds();
      this.view._mapDefinitionModel.trigger('change:legends');

      expect(this.view._infoboxState).toHaveBeenCalled();
    });

    it('should call ._onChangeEdition when _editorModel:edition changes', function () {
      spyOn(this.view, '_onChangeEdition');

      this.view._initBinds();
      this.view._editorModel.trigger('change:edition');

      expect(this.view._onChangeEdition).toHaveBeenCalled();
    });

    it('should call ._onChangeDisabled when _editorModel:disabled changes', function () {
      spyOn(this.view, '_onChangeDisabled');

      this.view._initBinds();
      this.view._editorModel.trigger('change:disabled');

      expect(this.view._onChangeDisabled).toHaveBeenCalled();
    });

    it('should call ._onTogglerChanged when _togglerModel:active changes', function () {
      spyOn(this.view, '_onTogglerChanged');

      this.view._initBinds();
      this.view._togglerModel.trigger('change:active');

      expect(this.view._onTogglerChanged).toHaveBeenCalled();
    });

    it('should call ._toggleOverlay when _overlayModel:visible changes', function () {
      spyOn(this.view, '_toggleOverlay');

      this.view._initBinds();
      this.view._overlayModel.trigger('change:visible');

      expect(this.view._toggleOverlay).toHaveBeenCalled();
    });
  });

  describe('._isLayerHidden', function () {
    it('should return true if layerDefinitionModel.visible is false', function () {
      this.layerDefinitionModel.set('visible', false, { silent: true });
      expect(this.view._isLayerHidden()).toBe(true);

      this.layerDefinitionModel.set('visible', true, { silent: true });
      expect(this.view._isLayerHidden()).toBe(false);
    });
  });

  describe('._isErrored', function () {
    it('should return layerContentModel isErrored', function () {
      var isErroredSpy = spyOn(this.view._layerContentModel, 'isErrored');

      isErroredSpy.and.returnValue(false);
      expect(this.view._isErrored()).toBe(false);

      isErroredSpy.and.returnValue(true);
      expect(this.view._isErrored()).toBe(true);
    });
  });

  describe('._showHiddenLayer', function () {
    it('should call layerDefinitionModel.toggleVisible', function () {
      spyOn(this.view._layerDefinitionModel, 'toggleVisible');

      this.view._showHiddenLayer();

      expect(this.view._layerDefinitionModel.toggleVisible).toHaveBeenCalled();
    });

    it('should call userActions.saveLayer', function () {
      this.view._showHiddenLayer();
      expect(this.view._userActions.saveLayer).toHaveBeenCalled();
    });
  });

  it('should transmit html snippets changes properly', function () {
    this.legendDefinitionsCollection.add(new LegendBaseDefinitionModel({
      type: 'category'
    }, {
      layerDefinitionModel: this.layerDefinitionModel,
      configModel: this.configModel,
      vizId: 'v-123'
    }));

    this.view._legendDefinitionModel = this.legendDefinitionsCollection.at(0);
    this.view._codemirrorModel.set('content', 'Wadus[[Legend]]');
    this.view._saveLegendHTML();
    this.view.render();

    expect(this.view._legendDefinitionModel.get('preHTMLSnippet')).toBe('Wadus');

    this.view._codemirrorModel.set('content', 'Foo[[Legend]]Bar');
    this.view._saveLegendHTML();

    expect(this.view._legendDefinitionModel.get('preHTMLSnippet')).toBe('Foo');
    expect(this.view._legendDefinitionModel.get('postHTMLSnippet')).toBe('Bar');
  });

  it('should not have any leaks', function () {
    this.view.render();

    expect(this.view).toHaveNoLeaks();
  });
});
