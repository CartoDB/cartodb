var Backbone = require('backbone');
var AnalysisDefinitionNodesCollection = require('../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var WidgetDefinitionsCollection = require('../../../../javascripts/cartodb3/data/widget-definitions-collection');

describe('data/widget-definitions-collection', function () {
  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      table_name: 'foobar'
    }, {
      configModel: configModel
    });

    this.layerDefinitionsCollection = new Backbone.Collection(this.layerDefinitionModel);

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.collection = new WidgetDefinitionsCollection(null, {
      configModel: configModel,
      mapId: 'm-123',
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection
    });

    this.originalAjax = Backbone.ajax;
    Backbone.ajax = function () {
      return {
        always: function (cb) {
          cb();
        }
      };
    };
  });

  afterEach(function () {
    Backbone.ajax = this.originalAjax;
    this.collection.reset();
  });

  describe('when a model is created', function () {
    beforeEach(function () {
      var histogram = {
        type: 'histogram',
        title: 'histogram',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col'
        }
      };
      this.collection.create(histogram);
    });

    it('should set order to 0 when a new widget is created', function () {
      var widget = this.collection.at(0);
      expect(widget.get('order')).toBe(0);
    });

    it('should increase previous widgets order value by one when a new widget is created', function () {
      var category = {
        type: 'category',
        title: 'category',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col'
        }
      };
      this.collection.create(category);

      // Check new widget order
      var widget = this.collection.at(0);
      expect(widget.get('order')).toBe(0);

      // Check previous widget order
      var previousWidget = this.collection.at(1);
      expect(previousWidget.get('order')).toBe(1);
    });

    it('should set widget order to provided value if widget had already been created', function () {
      var category = {
        type: 'category',
        order: 4,
        id: 'fakeid',
        title: 'category',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col'
        }
      };
      var categoryItem = this.collection.create(category);

      expect(categoryItem.get('order')).toBe(4);
    });

    it('should set a new order if widget had already been created without order', function () {
      var category = {
        type: 'category',
        id: 'fakeid',
        title: 'category',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col'
        }
      };
      var categoryItem = this.collection.create(category);

      expect(categoryItem.get('order')).toBe(1);
    });
  });

  describe('autoStyle', function () {
    beforeEach(function () {
      var histogram = {
        type: 'histogram',
        title: 'histogram',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col'
        }
      };

      var category = {
        type: 'category',
        title: 'category',
        layer_id: 'l-1',
        source: {
          id: 'a0'
        },
        options: {
          column: 'col2'
        }
      };

      this.collection.create(histogram);
      this.collection.create(category);
    });

    it('should update widgets autostyle when layer\'s style changes', function () {
      var styleModel = new Backbone.Model({
        type: 'simple',
        fill: {
          color: {
            fixed: '#fabada'
          }
        }
      });
      styleModel.canApplyAutoStyle = function () {
        return false;
      };

      this.layerDefinitionModel.styleModel = styleModel;
      var histogram = this.collection.at(0);
      var category = this.collection.at(0);

      histogram.set({auto_style_allowed: true});
      category.set({auto_style_allowed: true});

      this.layerDefinitionModel.set({style_properties: 'foo'});

      expect(histogram.get('auto_style_allowed')).toBeFalsy();
      expect(category.get('auto_style_allowed')).toBeFalsy();
    });
  });

  describe('.getColumnType', function () {
    it('shuld return the column type if schemaModel is fetched', function () {
      var querySchemaModel = new Backbone.Model({
        status: 'fetched'
      });
      querySchemaModel.columnsCollection = new Backbone.Collection([
        { name: 'cartodb_id', type: 'number' }
      ]);
      var node = {
        querySchemaModel: querySchemaModel
      };
      spyOn(this.collection._analysisDefinitionNodesCollection, 'get').and.returnValue(node);
      var type = this.collection.getColumnType('cartodb_id', 'a0');
      expect(type).toEqual('number');
    });
  });
});
