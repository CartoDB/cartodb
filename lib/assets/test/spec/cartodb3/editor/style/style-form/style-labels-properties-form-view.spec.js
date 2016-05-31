var Backbone = require('backbone');
var StyleModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var StyleLabelsPropertiesFormView = require('../../../../../../javascripts/cartodb3/editor/style/style-form/style-properties-form/style-labels-properties-form-view');

describe('editor/style/style-form/style-labels-properties-form-view', function () {
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

    var view = this.view = new StyleLabelsPropertiesFormView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
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
    it('should disabled subform when animated is enabled', function () {
      spyOn(this.view._enablerView, 'setValue');
      this.styleModel.set('animated', { enabled: true });
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

    it('should not render help message if geometry is not point', function () {
      expect(this.view.$('[name="enabler"] .js-help').length).toBe(1);
      this.querySchemaModel.getGeometry.and.returnValue({
        getSimpleType: function () { return 'polygon'; }
      });
      this.view.render();
      expect(this.view.$('[name="enabler"] .js-help').length).toBe(0);
    });
  });
});
