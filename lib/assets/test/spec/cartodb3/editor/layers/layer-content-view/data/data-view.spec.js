var Backbone = require('backbone');
var _ = require('underscore');
var DataView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-view');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var SQLModel = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/data/data-sql-model');

describe('editor/layers/layers-content-view/data/data-view', function () {
  beforeEach(function () {
    this.sqlModel = new SQLModel({
      content: 'SELECT * FROM table'
    });

    this.node = new Backbone.Model();
    this.node.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    this.layerDefinitionModel = new Backbone.Model();
    this.layerDefinitionModel.getAnalysisDefinitionNodeModel = function () {
      return this.node;
    }.bind(this);

    this.layerDefinitionModel.sqlModel = this.sqlModel;

    this.editorModel = new Backbone.Model();
    this.editorModel.isEditing = function () { return false; };

    this.view = new DataView({
      layerDefinitionModel: this.layerDefinitionModel,
      widgetDefinitionsCollection: new Backbone.Collection(),
      querySchemaModel: this.querySchemaModel,
      editorModel: this.editorModel,
      configModel: {}
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

  it('should not have leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
