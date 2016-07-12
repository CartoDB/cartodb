var Backbone = require('backbone');
var _ = require('underscore');
var DataView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-view');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var SQLModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-sql-model');

describe('editor/layers/layers-content-view/data/data-view', function () {
  beforeEach(function () {
    QuerySchemaModel.prototype.sync = function (a, b, opts) {
      opts.success({ rows: [] });
    };

    this.sqlModel = new SQLModel({
      content: 'SELECT * FROM table'
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

    this.view = new DataView({
      layerDefinitionModel: this.layerDefinitionModel,
      stackLayoutModel: this.stackLayoutModel,
      widgetDefinitionsCollection: new Backbone.Collection(),
      querySchemaModel: this.querySchemaModel,
      editorModel: this.editorModel,
      vis: this.vis,
      userActions: this.userActions,
      configModel: jasmine.createSpyObj('configModel', ['get'])
    });
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
    this.view.$('.js-input').click(); // change to sql editor
    spyOn(this.node.querySchemaModel, 'fetch');
    this.view._codemirrorModel.set('content', 'DELETE FROM table WHERE cartodb_id=2');
    this.view.$('.js-apply').click(); // apply sql
    expect(this.view._codemirrorModel.get('content')).toBe(originalQuery);
    expect(this.userActions.saveAnalysisSourceQuery).toHaveBeenCalled();
    expect(this.node.querySchemaModel.get('query_errors').length).toBe(0);
    expect(this.node.querySchemaModel.get('query')).toBe(originalQuery);
    expect(this.node.querySchemaModel.resetDueToAlteredData).toHaveBeenCalled();
  });

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
