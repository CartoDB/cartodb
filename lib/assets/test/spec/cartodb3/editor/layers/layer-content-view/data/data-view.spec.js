var Backbone = require('backbone');
var _ = require('underscore');
var DataView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-view');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var SQLModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-sql-model');
var VisDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/vis-definition-model');
var Notifier = require('../../../../../../../javascripts/cartodb3/components/notifier/notifier.js');
var cdb = require('cartodb.js');

describe('editor/layers/layers-content-view/data/data-view', function () {
  beforeEach(function () {
    this.sqlModel = new SQLModel({
      content: 'SELECT * FROM table'
    });

    cdb.SQL.prototype.execute = function (query, vars, params) {
      params.success();
    };

    this.configModel = new Backbone.Model({
      sql_api_template: 'http://{user}.localhost.lan:8080',
      user_name: 'pepito',
      api_key: 'hello-apikey'
    });

    this.node = new Backbone.Model({
      type: 'source'
    });
    this.node.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });
    this.stackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['goToStep']);

    this.layerDefinitionModel = new Backbone.Model();
    this.layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return this.node;
    }.bind(this);
    this.layerDefinitionModel.getTableName = function () {
      return 'table';
    };

    this.layerDefinitionModel.sqlModel = this.sqlModel;

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };
    this.vis = jasmine.createSpyObj('vis', ['instantiateMap']);
    this.userActions = jasmine.createSpyObj('userActions', ['saveAnalysisSourceQuery']);

    this.visDefinitionModel = new VisDefinitionModel({
      name: 'Foo Map',
      privacy: 'PUBLIC',
      updated_at: '2016-06-21T15:30:06+00:00',
      type: 'derived'
    }, {
      configModel: this.configModel
    });

    Notifier.init({
      editorModel: this.editorModel,
      visDefinitionModel: this.visDefinitionModel
    });

    spyOn(Notifier, 'addNotification').and.callThrough();

    this.view = new DataView({
      layerDefinitionModel: this.layerDefinitionModel,
      stackLayoutModel: this.stackLayoutModel,
      widgetDefinitionsCollection: new Backbone.Collection(),
      querySchemaModel: this.querySchemaModel,
      editorModel: this.editorModel,
      vis: this.vis,
      userActions: this.userActions,
      configModel: this.configModel
    });

    spyOn(this.view, 'clean');
    this.view.render();
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(1);
  });

  it('should create internal codemirror model', function () {
    expect(this.view._codemirrorModel).toBeDefined();
  });

  describe('bindings', function () {
    it('should set codemirror value when query schema model changes', function () {
      spyOn(this.view._codemirrorModel, 'set');
      this.node.querySchemaModel.set('query_errors', ['Syntax error']);
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should update codemirror if query schema model changes', function () {
      spyOn(this.view._codemirrorModel, 'set');
      this.view._querySchemaModel.set({query: 'SELECT * FROM table LIMIT 10'});
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });

    it('should set codemirror value when undo or redo is applied', function () {
      this.sqlModel.set('content', 'SELECT foo FROM table');
      spyOn(this.view._codemirrorModel, 'set');
      this.sqlModel.undo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
      this.view._codemirrorModel.set.calls.reset();
      this.sqlModel.redo();
      expect(this.view._codemirrorModel.set).toHaveBeenCalled();
    });
  });

  it('should apply default query and refresh map and dataset view when query alters data', function () {
    var originalQuery = 'SELECT * FROM table';
    spyOn(this.editorModel, 'isEditing').and.returnValue(true);
    spyOn(this.node.querySchemaModel, 'resetDueToAlteredData');
    this.view._codemirrorModel.set('content', 'DELETE FROM table WHERE cartodb_id=2');
    this.view._parseSQL();
    expect(this.view._codemirrorModel.get('content')).toBe(originalQuery);
    expect(this.userActions.saveAnalysisSourceQuery).toHaveBeenCalled();
    expect(this.node.querySchemaModel.get('query_errors').length).toBe(0);
    expect(this.node.querySchemaModel.get('query')).toBe(originalQuery);
    expect(this.node.querySchemaModel.resetDueToAlteredData).toHaveBeenCalled();
  });

  it('should not let run the same query that is applied', function () {
    var originalQuery = 'SELECT * FROM table';
    spyOn(this.node.querySchemaModel, 'fetch');
    this.node.querySchemaModel.set('query', originalQuery);
    this.view._codemirrorModel.set('content', originalQuery);
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).not.toHaveBeenCalled();
    this.view._codemirrorModel.set('content', originalQuery.toUpperCase());
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should not apply an empty query', function () {
    spyOn(this.node.querySchemaModel, 'fetch');
    this.view._codemirrorModel.set('content', '');
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should not throw notification if same query that is applied', function () {
    spyOn(this.node.querySchemaModel, 'fetch');
    this.view._sqlModel.set('content', 'SELECT * FROM table');
    this.view._codemirrorModel.set('content', 'SELECT * + FROM table');
    this.view._parseSQL();
    expect(this.node.querySchemaModel.fetch).toHaveBeenCalled();
    this.node.querySchemaModel.set('query_errors', ['Syntax error']);
    this.view._codemirrorModel.set('content', 'SELECT * FROM table');
    this.node.querySchemaModel.set('query_errors', []);
    this.view._saveSQL();
    expect(Notifier.addNotification).toHaveBeenCalledTimes(1);
  });

  it('should listen vis reload to show success notification', function () {
    var query = 'SELECT * FROM table limit 10';
    spyOn(this.editorModel, 'isEditing').and.returnValue(true);
    this.view._codemirrorModel.set('content', query);
    this.view._saveSQL();

    expect(this.view._sqlNotification).toBeDefined();
    expect(this.view._sqlNotification.get('status')).toBe('loading');

    this.visDefinitionModel.trigger('vis:reload');
    expect(this.view._sqlNotification.get('status')).toBe('success');
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
