var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var DatasetOptionsView = require('../../../../javascripts/cartodb3/dataset/dataset-options/dataset-options-view');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');
var QueryGeometryModel = require('../../../../javascripts/cartodb3/data/query-geometry-model');
var QuerySchemaModel = require('../../../../javascripts/cartodb3/data/query-schema-model');
var VisModel = require('../../../../javascripts/cartodb3/data/vis-definition-model');
var LayerDefinitionModel = require('../../../../javascripts/cartodb3/data/layer-definition-model');
var EditorModel = require('../../../../javascripts/cartodb3/data/editor-model');

describe('dataset/dataset-options-view', function () {
  var view;
  var editorModel;
  var visModel;

  beforeEach(function () {
    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'pepe'
    });

    var userModel = new UserModel({
      username: 'pepe',
      actions: {
        private_tables: true
      }
    }, {
      configModel: configModel
    });

    var tableModel = new TableModel({
      name: 'table_1'
    }, {
      configModel: configModel
    });

    var permission = {
      owner: {
        username: 'pepe'
      }
    };

    tableModel.set('permission', permission);

    visModel = new VisModel({
      name: 'table_1',
      privacy: 'PUBLIC'
    }, {
      configModel: configModel
    });

    this.querySchemaModel = new QuerySchemaModel({
      status: 'unfetched',
      query: 'SELECT * FROM table_1'
    }, {
      configModel: configModel
    });
    spyOn(this.querySchemaModel, 'fetch');

    this.queryGeometryModel = new QueryGeometryModel({
      status: 'unfetched',
      query: 'SELECT * FROM table_1'
    }, {
      configModel: {}
    });
    spyOn(this.queryGeometryModel, 'fetch');

    editorModel = new EditorModel();

    var layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      table_name: 'table_1'
    }, {
      configModel: configModel
    });

    var syncModel = jasmine.createSpyObj('syncModel', ['get', 'set', 'isSync', 'bind', 'off', 'isSyncing']);
    var router = jasmine.createSpyObj('router', ['navigate']);
    var modals = jasmine.createSpyObj('modals', ['create']);

    spyOn(DatasetOptionsView.prototype, '_onChangeName').and.callThrough();

    view = new DatasetOptionsView({
      editorModel: editorModel,
      router: router,
      modals: modals,
      configModel: configModel,
      userModel: userModel,
      tableModel: tableModel,
      visModel: visModel,
      syncModel: syncModel,
      queryGeometryModel: this.queryGeometryModel,
      querySchemaModel: this.querySchemaModel,
      layerDefinitionModel: layerDefinitionModel
    });

    view.render();
  });

  it('should render properly', function () {
    expect(view.$('.Options-bar').length).toBe(1);
    expect(view.$('.js-input').length).toBe(1);
    expect(view.$('.js-input:checked').length).toBe(0);
    expect(view.$('.js-previewMap').length).toBe(0);
    expect(view.$('.js-createMap').length).toBe(1);
  });

  it('should render properly when edition', function () {
    var content = view._codemirrorModel.get('content');
    editorModel.set('edition', true);
    expect(view.$('.Dataset-codemirror').length).toBe(1);
    expect(content).toContain('table_1');
  });

  it('should not apply an empty query', function () {
    view._codemirrorModel.set('content', '');
    view._parseSQL();
    expect(this.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should fetch geometry when a query is applied', function () {
    view._codemirrorModel.set('content', 'select * from whatever');
    view._parseSQL();
    expect(this.queryGeometryModel.get('simple_geom')).toBe('');
    expect(this.queryGeometryModel.get('query')).toBe('select * from whatever');
    expect(this.queryGeometryModel.fetch).toHaveBeenCalled();
  });

  it('should remove ; character from the query if it is in the last position', function () {
    view._codemirrorModel.set('content', 'select * from whatever;');
    view._parseSQL();
    expect(view._codemirrorModel.get('content')).toBe('select * from whatever');
    expect(this.querySchemaModel.fetch).toHaveBeenCalled();

    view._codemirrorModel.set('content', 'select * from whatever; hello');
    view._parseSQL();
    expect(view._codemirrorModel.get('content')).toBe('select * from whatever; hello');
  });

  it('should render preview button if geometry exists', function () {
    this.queryGeometryModel.set('simple_geom', 'polygon');
    this.querySchemaModel.columnsCollection.reset([{
      name: 'the_geom_webmercator'
    }]);
    view.render();
    expect(view.$('.js-previewMap').length).toBe(1);
  });

  it('should respond to change dataset name', function () {
    spyOn(view, '_parseSQL');
    visModel.set('name', 'foo');
    expect(DatasetOptionsView.prototype._onChangeName).toHaveBeenCalled();
    expect(view._parseSQL).not.toHaveBeenCalled();

    var content = view._codemirrorModel.get('content');
    expect(content).toContain('foo');
    expect(content).not.toContain('table_1');
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });
});
