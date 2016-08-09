var Backbone = require('backbone');
var _ = require('underscore');
var StyleModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');
var LayerDefinitionsCollection = require('../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var StylePropertiesFormView = require('../../../../../../javascripts/cartodb3/editor/style/style-form/style-properties-form/style-properties-form-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');

describe('editor/style/style-form/style-properties-form-view', function () {
  beforeEach(function () {
    this.styleModel = new StyleModel({}, { parse: true });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });
    spyOn(this.querySchemaModel, 'getGeometry').and.returnValue({
      getSimpleType: function () { return 'point'; }
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      configModel: this.configModel,
      mapId: 'map-123'
    });
    spyOn(this.layerDefinitionsCollection, 'isThereAnyTorqueLayer').and.returnValue(false);

    this.layerDefinitionModel = new Backbone.Model();
    this.layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return new Backbone.Model({
        id: 'a0',
        type: 'source',
        table_name: 'foo'
      });
    };

    this.view = new StylePropertiesFormView({
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      layerDefinitionModel: this.layerDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      styleModel: this.styleModel,
      configModel: this.configModel
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

    it('should show shape and labels forms', function () {
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$el.html()).toContain('editor.style.components.fill');
      expect(this.view.$el.html()).toContain('editor.style.components.stroke.label');
      expect(this.view.$el.html()).toContain('editor.style.components.blending.label');
      expect(this.view.$el.html()).toContain('editor.style.components.labels-enabled');
    });

    it('should show unanimatable view if animated and no numeric or dates columns', function () {
      spyOn(this.view, '_isUnanimatable').and.returnValue(true);
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$el.html()).toContain('editor.style.style-form.unanimatable.desc');
    });

    it('should not display labels option if heatmap style is selected', function () {
      this.styleModel.set('type', 'heatmap');
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$el.html()).not.toContain('editor.style.components.labels-enabled');
    });

    it('should not display animated option if dataset geometry is not points', function () {
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

    it('should not display animated option if styles are aggregated', function () {
      spyOn(this.styleModel, 'isAggregatedType').and.returnValue(true);
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$el.html()).not.toContain('editor.style.components.animated-enabled');
    });
  });
});
