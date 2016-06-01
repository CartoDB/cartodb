var Backbone = require('backbone');
var _ = require('underscore');
var StyleModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var StylePropertiesFormView = require('../../../../../../javascripts/cartodb3/editor/style/style-form/style-properties-form/style-properties-form-view');

describe('editor/style/style-form/style-properties-form-view', function () {
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
      mapId: 'map-123',
      basemaps: []
    });
    spyOn(this.layerDefinitionsCollection, 'isThereAnyTorqueLayer').and.returnValue(false);

    this.layerDefinitionModel = new Backbone.Model();

    this.view = new StylePropertiesFormView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      styleModel: this.styleModel
    });
  });

  describe('.render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should apply proper form step number', function () {
      expect(this.view.$('.Editor-HeaderNumeration').text()).toBe('2');
      spyOn(this.styleModel, 'isAggregatedType').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.Editor-HeaderNumeration').text()).toBe('3');
    });

    it('should show shape, labels and animated forms', function () {
      expect(_.size(this.view._subviews)).toBe(3);
      expect(this.view.$el.html()).toContain('editor.style.components.fill');
      expect(this.view.$el.html()).toContain('editor.style.components.stroke.label');
      expect(this.view.$el.html()).toContain('editor.style.components.blending.label');
      expect(this.view.$el.html()).toContain('editor.style.components.labels-enabled');
      expect(this.view.$el.html()).toContain('editor.style.components.animated-enabled');
    });

    it('should not display labels option if heatmap style is selected', function () {
      this.styleModel.set('type', 'heatmap');
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$el.html()).not.toContain('editor.style.components.labels-enabled');
    });

    it('should not display animated option dataset geometry is not points', function () {
      var self = this;
      function changeGeometryType (type) {
        self.querySchemaModel.getGeometry = function () {
          return {
            getSimpleType: function () { return type; }
          };
        };
      }
      changeGeometryType('polygon');
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$el.html()).not.toContain('editor.style.components.animated-enabled');
      changeGeometryType('line');
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$el.html()).not.toContain('editor.style.components.animated-enabled');
    });
  });
});
