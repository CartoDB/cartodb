var $ = require('jquery');
var Backbone = require('backbone');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var WidgetDefinitionsCollection = require('builder/data/widget-definitions-collection');

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
      vizId: 'v-123',
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

    xit('should set a new order when a new widget is created', function () { // FIXME change this test
      var widget = this.collection.at(0);
      expect(widget.get('order')).toBe(0);
      widget.set('order', 10);
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
      var widget2 = this.collection.at(1);
      expect(widget2.get('order')).toBe(11);
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
    it('should return the column type if schemaModel is fetched', function () {
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

  describe('.addWidgetAsync', function () {
    var callback;
    var successResponse = { response: 'success' };
    var errorResponse = { response: 'error' };

    beforeEach(function () {
      this.collection.create = function (options, callbacks) {
        if (callback === 'success') {
          callbacks.success.call(this, successResponse);
        } else {
          callbacks[callback].call(this, 'error', errorResponse);
        }
      };
    });

    it('should return a success response if it has been created successfully', function (done) {
      var triggerSpy = spyOn(this.collection, 'trigger');
      var widgetModel = new Backbone.Model();

      callback = 'success';

      this.collection.addWidgetAsync(widgetModel, {})
        .then(function (response) {
          expect(triggerSpy).toHaveBeenCalledWith('successAdd', widgetModel);
          expect(response).toEqual(successResponse);
          done();
        });
    });

    it('should return an error response if the it could not be created', function (done) {
      var triggerSpy = spyOn(this.collection, 'trigger');
      var widgetModel = new Backbone.Model();

      callback = 'error';

      this.collection.addWidgetAsync(widgetModel, {})
        .catch(function (response) {
          expect(triggerSpy).toHaveBeenCalledWith('error', widgetModel, errorResponse);
          expect(response).toEqual(errorResponse);
          done();
        });
    });
  });

  describe('.updateWidgetsOrder', function () {
    it('should change set the widgets in increasing order', function () {
      var collectionSaveSpy = spyOn(this.collection, 'save').and.callThrough();

      this.collection.updateWidgetsOrder();

      this.collection.each(function (model, index) {
        expect(model.order).toEqual(index);
      });

      expect(collectionSaveSpy).toHaveBeenCalled();
    });
  });
});
