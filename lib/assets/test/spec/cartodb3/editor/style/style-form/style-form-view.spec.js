var Backbone = require('backbone');
var _ = require('underscore');
var StyleFormView = require('../../../../../../javascripts/cartodb3/editor/style/style-form/style-form-view');
var StyleDefinitionModel = require('../../../../../../javascripts/cartodb3/editor/style/style-definition-model');
var QueryGeometryModel = require('../../../../../../javascripts/cartodb3/data/query-geometry-model');
var QuerySchemaModel = require('../../../../../../javascripts/cartodb3/data/query-schema-model');

describe('editor/style/style-form/style-form-view', function () {
  beforeEach(function () {
    this.model = new StyleDefinitionModel();
    this.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * from table'
    }, {
      configModel: {}
    });
    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * from table'
    }, {
      configModel: {}
    });
    this.view = new StyleFormView({
      layerDefinitionsCollection: new Backbone.Collection(),
      layerDefinitionModel: new Backbone.Model(),
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      styleModel: this.model,
      configModel: {}
    });
    this.view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.Editor-HeaderInfo').length).toBe(1);
      expect(this.view.$el.html()).toContain('editor.style.style-form.properties.title-label');
    });

    it('should render none message when style type is none', function () {
      this.model.resetStyles();
      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$el.html()).toContain('editor.style.messages.none');
    });

    it('should render aggregation form if type is aggregated', function () {
      this.model.setDefaultPropertiesByType('squares', 'points');
      expect(this.view.$('.Editor-HeaderInfo').length).toBe(2);
      expect(_.size(this.view._subviews)).toBe(2);
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
