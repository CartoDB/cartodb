var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var QuerySchemaModel = require('builder/data/query-schema-model');
var WidgetsFormView = require('builder/editor/widgets/widgets-form/widgets-form-view');
var WidgetDefinitionModel = require('builder/data/widget-definition-model');
var UserActions = require('builder/data/user-actions');
var FactoryModals = require('../../../factories/modals');

describe('editor/widgets/widgets-form/widgets-form-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM foobar',
      status: 'fetched'
    }, {
      configModel: this.configModel
    });
    this.querySchemaModel.columnsCollection.reset([
      { name: 'cartodb_id', type: 'number' },
      { name: 'created_at', type: 'date' }
    ]);

    var dfd = $.Deferred();
    dfd.resolve();
    spyOn(this.querySchemaModel, 'fetch').and.returnValue(dfd.promise());

    this.widgetDefinitionModel = new WidgetDefinitionModel({
      id: 'w-456',
      title: 'some title',
      type: 'formula',
      layer_id: 'l1',
      source: 'a0',
      column: 'hello',
      operation: 'sum'
    }, {
      configModel: this.configModel,
      mapId: 'm-123'
    });

    this.modals = FactoryModals.createModalService();

    this.userModel = {
      featureEnabled: function () {
        return true;
      }
    };

    this.userActions = UserActions({
      userModel: this.userModel,
      analysisDefinitionsCollection: {},
      analysisDefinitionNodesCollection: {},
      layerDefinitionsCollection: {},
      widgetDefinitionsCollection: {}
    });
    this.promise = $.Deferred();
    spyOn(this.userActions, 'saveWidget').and.returnValue(this.promise);

    this.view = new WidgetsFormView({
      userActions: this.userActions,
      widgetDefinitionModel: this.widgetDefinitionModel,
      querySchemaModel: this.querySchemaModel,
      configModel: {},
      userModel: this.userModel,
      modals: this.modals
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // carousel and form fields
  });

  it('should update form model when widgetDefinitionModel rename', function () {
    this.widgetDefinitionModel.set({title: 'wadus'});
    expect(this.view._formView._widgetFormModel.get('title')).toBe('wadus');
  });

  it('should have enabler editor component for suffix and prefix, disable by default', function () {
    expect(this.view.$('input[name=prefix]').length).toBe(1);
    expect(this.view.$('input[name=suffix]').length).toBe(1);
    expect(this.view.$('input[name=prefix]').prop('readonly')).toBe(true);
    expect(this.view.$('input[name=suffix]').prop('readonly')).toBe(true);
  });

  it('should include widget style fields if needed', function () {
    // formula widget
    expect(this.view.$('div.js-input[name=widget_style_definition]').length).toBe(0);
    expect(this.view.$('div.js-input[name=auto_style_definition]').length).toBe(0);

    this.widgetDefinitionModel.set({type: 'category'});
    this.view.render();

    // category widget
    expect(this.view.$('div.js-input[name=widget_style_definition]').length).toBe(1);
    expect(this.view.$('div.js-input[name=auto_style_definition]').length).toBe(1);

    this.widgetDefinitionModel.set({type: 'histogram'});
    this.view.render();

    // category widget
    expect(this.view.$('div.js-input[name=widget_style_definition]').length).toBe(1);
    expect(this.view.$('div.js-input[name=auto_style_definition]').length).toBe(1);
  });

  describe('._initBinds', function () {
    it('should call ._renderFormAndValidate when change:type of _widgetDefinitionModel is triggered', function () {
      spyOn(this.view, '_renderFormAndValidate');

      this.view._initBinds();
      this.view._widgetDefinitionModel.set('type', 'histogram');

      expect(this.view._renderFormAndValidate).toHaveBeenCalled();
    });

    it('should call .render when change:status of _querySchemaModel is triggered', function () {
      spyOn(this.view, 'render');

      this.view._initBinds();
      this.view._querySchemaModel.set('status', 'error');

      expect(this.view.render).toHaveBeenCalled();
    });

    it('should call ._shouldFetchQuery when change:status of _querySchemaModel:query changes', function () {
      spyOn(this.view, '_shouldFetchQuery');

      this.view._initBinds();
      this.view._querySchemaModel.set('query', 'SELECT * FROM somewhere;');

      expect(this.view._shouldFetchQuery).toHaveBeenCalled();
    });
  });

  describe('._getFilteredDataTypes', function () {
    beforeEach(function () {
      var collection = new Backbone.Collection();

      var widgetDefinitionModel1 = new WidgetDefinitionModel({
        title: 'some title',
        type: 'formula',
        layer_id: 'l1',
        source: 'a0',
        column: 'hello',
        operation: 'sum'
      }, {
        collection: collection,
        configModel: this.configModel,
        mapId: 'm-123'
      });

      var widgetDefinitionModel2 = new WidgetDefinitionModel({
        layer_id: 'l1',
        title: 'some title',
        type: 'time-series',
        options: {
          column: 'hello'
        }
      }, {
        collection: collection,
        configModel: this.configModel,
        mapId: 'm-123'
      });

      var widgetDefinitionModel3 = new WidgetDefinitionModel({
        title: 'some title',
        type: 'formula',
        layer_id: 'l1',
        source: 'a0',
        column: 'hello',
        operation: 'sum'
      }, {
        collection: new Backbone.Collection(),
        configModel: this.configModel,
        mapId: 'm-123'
      });

      collection.add(widgetDefinitionModel1);
      collection.add(widgetDefinitionModel2);

      this.view1 = new WidgetsFormView({
        userActions: this.userActions,
        querySchemaModel: this.querySchemaModel,
        configModel: {},
        widgetDefinitionModel: widgetDefinitionModel1,
        userModel: this.userModel,
        modals: this.modals
      });

      this.view2 = new WidgetsFormView({
        userActions: this.userActions,
        querySchemaModel: this.querySchemaModel,
        configModel: {},
        widgetDefinitionModel: widgetDefinitionModel2,
        userModel: this.userModel,
        modals: this.modals
      });

      this.view3 = new WidgetsFormView({
        userActions: this.userActions,
        querySchemaModel: this.querySchemaModel,
        configModel: {},
        widgetDefinitionModel: widgetDefinitionModel3,
        userModel: this.userModel,
        modals: this.modals
      });
    });

    it('should not include time-series if there is a time-series widget', function () {
      var filteredDataTypes = this.view1._getFilteredDataTypes();
      expect(filteredDataTypes.length).toBe(3);
    });
    it('should include time-series if it is a time-series widget', function () {
      var filteredDataTypes = this.view2._getFilteredDataTypes();
      expect(filteredDataTypes.length).toBe(4);
    });
    it('should include time-series if there is not a time-series widget', function () {
      var filteredDataTypes = this.view3._getFilteredDataTypes();
      expect(filteredDataTypes.length).toBe(4);
    });

    afterEach(function () {
      this.view1.clean();
      this.view2.clean();
      this.view3.clean();
    });
  });

  describe('._renderFormAndValidate', function () {
    it('should call _renderForm and saveWidget if the form pass the validation', function () {
      spyOn(this.view, '_renderForm');
      spyOn(this.view._formView, 'validateForm').and.returnValue(null);

      this.view._renderFormAndValidate();

      expect(this.view._renderForm).toHaveBeenCalled();
      expect(this.view._userActions.saveWidget).toHaveBeenCalledWith(this.widgetDefinitionModel);
    });

    it('should call _renderForm and not call saveWidget if the form dont pass the validation', function () {
      spyOn(this.view, '_renderForm');
      spyOn(this.view._formView, 'validateForm').and.returnValue('Error');

      this.view._renderFormAndValidate();

      expect(this.view._renderForm).toHaveBeenCalled();
      expect(this.view._userActions.saveWidget).not.toHaveBeenCalled();
    });
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
