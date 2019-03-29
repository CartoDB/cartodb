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

  describe('.url', function () {
    it('should return the url to update widgets', function () {
      expect(this.collection.url()).toEqual('/u/pepe/api/v3/maps/m-123/widgets');
    });
  });

  describe('.parse', function () {
    it('should return an empty array if there are not widgets', function () {
      expect(this.collection.parse({})).toEqual([]);
    });

    it('should parse the response from the server', function () {
      var widgets = [{
        id: 'widget',
        order: 0
      }];

      expect(this.collection.parse({widgets: widgets})).toEqual(widgets);
    });
  });

  describe('.save', function () {
    it('should call the bakcbone method to update', function () {
      spyOn(Backbone, 'sync');
      this.collection.save();
      expect(Backbone.sync.calls.mostRecent().args[0]).toEqual('update');
    });
  });

  describe('.addWidget', function () {
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
      var widgetModel = new Backbone.Model();

      callback = 'success';

      this.collection.addWidget(widgetModel, {})
        .then(function (response) {
          expect(response).toEqual(successResponse);
          done();
        });
    });

    it('should return an error response if the it could not be created', function (done) {
      var widgetModel = new Backbone.Model();

      callback = 'error';

      this.collection.addWidget(widgetModel, {})
        .catch(function (response) {
          expect(response).toEqual(errorResponse);
          done();
        });
    });
  });

  describe('.updateWidgetsOrder', function () {
    it('should change set the widgets in increasing order', function () {
      spyOn(this.collection, 'save').and.callThrough();
      spyOn(this.collection, 'saveAsync').and.callThrough();

      this.collection.updateWidgetsOrder();

      this.collection.each(function (model, index) {
        expect(model.order).toEqual(index);
      });

      expect(this.collection.save).toHaveBeenCalled();
      expect(this.collection.saveAsync).toHaveBeenCalled();
    });
  });

  describe('.saveAsync', function () {
    var callback;
    var successResponse = { response: 'success' };
    var errorResponse = { response: 'error' };

    var syncFn = function (method, collection, callbacks) {
      if (callback === 'success') {
        callbacks.success.call(this, successResponse);
      } else if (callback === 'error') {
        callbacks.error.call(this, 'error', errorResponse);
      }
    };

    beforeEach(function () {
      spyOn(Backbone, 'sync').and.callFake(syncFn);
    });

    it('should trigger a loading event when called', function () {
      var testModel = new Backbone.Model();

      spyOn(this.collection, 'trigger');
      this.collection.saveAsync(testModel);

      expect(this.collection.trigger).toHaveBeenCalledWith('loading', testModel);
    });

    it('should trigger "errorAdd" if the save function has not worked', function (done) {
      var testModel = new Backbone.Model();

      callback = 'error';

      spyOn(this.collection, 'trigger');
      this.collection.saveAsync(testModel);

      setTimeout(function () {
        expect(this.collection.trigger).toHaveBeenCalledWith('errorAdd', 'error');
        done();
      }.bind(this));
    });

    it('should trigger "successAdd" if the save function has worked', function (done) {
      var testModel = new Backbone.Model();

      callback = 'success';

      spyOn(this.collection, 'trigger');
      this.collection.saveAsync(testModel);

      setTimeout(function () {
        expect(this.collection.trigger).toHaveBeenCalledWith('successAdd', testModel);
        done();
      }.bind(this));
    });

    it('should return a resolved promise if the save function works', function (done) {
      callback = 'success';

      this.collection.saveAsync()
        .then(function (response) {
          expect(response).toEqual(successResponse);
          done();
        });
    });

    it('should return a rejected promise if the save function does not work', function (done) {
      callback = 'error';

      this.collection.saveAsync()
        .catch(function (response) {
          expect(response).toEqual(errorResponse);
          done();
        });
    });
  });
});
