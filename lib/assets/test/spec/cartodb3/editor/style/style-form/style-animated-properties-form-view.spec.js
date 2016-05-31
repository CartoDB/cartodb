var Backbone = require('backbone');
var StyleModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var StyleAnimatedPropertiesFormView = require('../../../../../../javascripts/cartodb3/editor/style/style-form/style-properties-form/style-animated-properties-form-view');

describe('editor/style/style-form/style-animated-properties-form-view', function () {
  beforeEach(function () {
    this.styleModel = new StyleModel({}, { parse: true });

    this.querySchemaModel = new QuerySchemaModel({
      status: 'fetched'
    }, {
      configModel: {}
    });
    spyOn(this.querySchemaModel, 'getGeometry').and.returnValue({
      getSimpleType: function () { return 'point'; }
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      analysisDefinitionsCollection: new Backbone.Collection(),
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      configModel: {},
      mapId: 'map-123'
    });
    spyOn(this.layerDefinitionsCollection, 'isThereAnyTorqueLayer').and.returnValue(false);

    this.layerDefinitionModel = new Backbone.Model();

    var view = this.view = new StyleAnimatedPropertiesFormView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      styleModel: this.styleModel
    });
    view.render();

    this._changeEnabler = function () {
      var $el = view.$('[name="enabler"] .js-input');
      var status = $el.is(':checked');
      $el.prop('checked', !status);
      view.$('[name="enabler"] .js-input').change();
    };
  });

  describe('bindings', function () {
    it('should disabled subform when labels are enabled', function () {
      spyOn(this.view._enablerView, 'setValue');
      this.styleModel.set('labels', { enabled: true });
      expect(this.view._enablerView.setValue).toHaveBeenCalledWith(false);
    });
  });

  describe('render', function () {
    it('should include enabler from the beginning', function () {
      expect(this.view._enablerView).toBeDefined();
      expect(this.view.$('[name="enabler"]').length).toBe(1);
      expect(this.view.$('[name="enabler"] .js-input').length).toBe(1);
      expect(this.view.$('[name="enabler"] .js-input').is(':checked')).toBeFalsy();
    });

    it('should render subform depending enabler state', function () {
      expect(this.view.$('form.Editor-formInner--nested').length).toBe(0);
      this._changeEnabler();
      expect(this.view.$('form.Editor-formInner--nested').length).toBe(1);
      this._changeEnabler();
      expect(this.view.$('form.Editor-formInner--nested').length).toBe(0);
    });

    it('should be disabled if there is already a torque layer', function () {
      this.layerDefinitionsCollection.isThereAnyTorqueLayer.and.returnValue(true);
      this.layerDefinitionModel.set('type', 'cartodb');
      this.view.render();
      expect(this.view.$('[name="enabler"] .js-input').is(':checked')).toBeFalsy();
      expect(this.view.$('[name="enabler"] .js-input').is(':disabled')).toBeTruthy();
    });

    it('should not appear disabled if the layer itself is torque', function () {
      this.layerDefinitionsCollection.isThereAnyTorqueLayer.and.returnValue(true);
      this.layerDefinitionModel.set('type', 'torque');
      this.view.render();
      expect(this.view.$('[name="enabler"] .js-input').is(':checked')).toBeFalsy();
      expect(this.view.$('[name="enabler"] .js-input').is(':disabled')).toBeFalsy();
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
