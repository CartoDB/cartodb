var Backbone = require('backbone');
var _ = require('underscore');
var StyleModel = require('builder/editor/style/style-definition-model');
var QueryGeometryModel = require('builder/data/query-geometry-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var StylePropertiesFormView = require('builder/editor/style/style-form/style-properties-form/style-properties-form-view');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var FactoryModals = require('../../../factories/modals');

describe('editor/style/style-form/style-properties-form-view', function () {
  beforeEach(function () {
    var self = this;

    this.styleModel = new StyleModel({}, { parse: true });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    this.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      simple_geom: 'point',
      ready: true,
      status: 'fetched'
    }, {configModel: {}});

    this.changeGeometryType = function (type) {
      self.queryGeometryModel.set('simple_geom', type);
    };

    this.layerDefinitionsCollection = new LayerDefinitionsCollection([], {
      analysisDefinitionNodesCollection: new Backbone.Collection(),
      configModel: this.configModel,
      userModel: this.userModel,
      mapId: 'map-123',
      stateDefinitionModel: {}
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
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      styleModel: this.styleModel,
      configModel: this.configModel,
      userModel: {
        featureEnabled: function () { return true; }
      },
      modals: FactoryModals.createModalService()
    });
  });

  describe('.render', function () {
    beforeEach(function () {
      this.view.render();
    });

    it('should have proper class name for onboarding', function () {
      expect(this.view.$el.children().first().hasClass('js-styleProperties')).toBe(true);
    });

    it('should apply proper form step number', function () {
      expect(this.view.$('.Editor-HeaderNumeration').text()).toBe('2');
      spyOn(this.styleModel, 'isAggregatedType').and.returnValue(true);
      this.view.render();
      expect(this.view.$('.Editor-HeaderNumeration').text()).toBe('3');
      this.styleModel.isAggregatedType.and.returnValue(false);
      this.changeGeometryType('polygon');
      this.view.render();
      expect(this.view.$('.Editor-HeaderNumeration').text()).toBe('1');
      this.changeGeometryType('line');
      this.view.render();
      expect(this.view.$('.Editor-HeaderNumeration').text()).toBe('1');
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
      this.changeGeometryType('polygon');
      this.view.render();
      expect(_.size(this.view._subviews)).toBe(2);
      expect(this.view.$el.html()).not.toContain('editor.style.components.animated-enabled');
      this.changeGeometryType('line');
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
