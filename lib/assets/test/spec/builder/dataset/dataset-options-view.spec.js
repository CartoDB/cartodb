var ConfigModel = require('builder/data/config-model');
var DatasetOptionsView = require('builder/dataset/dataset-options/dataset-options-view');
var UserModel = require('builder/data/user-model');
var AnalysisDefinitionNodeSourceModel = require('builder/data/analysis-definition-node-source-model');
var VisModel = require('builder/data/vis-definition-model');
var LayerDefinitionModel = require('builder/data/layer-definition-model');
var EditorModel = require('builder/data/editor-model');

describe('dataset/dataset-options-view', function () {
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

    this.analysisDefinitionNodeModel = new AnalysisDefinitionNodeSourceModel({
      query: 'select * from table_1',
      table_name: 'table_1',
      id: 'dummy-id'
    }, {
      tableData: {
        permission: {
          owner: {
            username: 'pepe'
          }
        },
        synchronization: {}
      },
      configModel: configModel,
      userModel: userModel
    });

    this.querySchemaModel = this.analysisDefinitionNodeModel.querySchemaModel;
    this.queryGeometryModel = this.analysisDefinitionNodeModel.queryGeometryModel;
    this.tableModel = this.analysisDefinitionNodeModel.getTableModel();
    this.syncModel = this.tableModel.getSyncModel();

    spyOn(this.querySchemaModel, 'fetch');
    spyOn(this.queryGeometryModel, 'fetch');
    spyOn(this.tableModel, 'isSync');

    this.editorModel = new EditorModel();

    var layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      type: 'CartoDB',
      table_name: 'table_1'
    }, {
      configModel: configModel
    });

    this.visModel = new VisModel({
      name: 'table_1',
      privacy: 'PUBLIC'
    }, {
      configModel: configModel
    });

    var router = jasmine.createSpyObj('router', ['navigate']);
    var modals = jasmine.createSpyObj('modals', ['create', 'isOpen']);

    spyOn(DatasetOptionsView.prototype, '_onChangeName').and.callThrough();

    this.view = new DatasetOptionsView({
      editorModel: this.editorModel,
      router: router,
      modals: modals,
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel,
      visModel: this.visModel,
      layerDefinitionModel: layerDefinitionModel,
      onToggleEdition: function () {}
    });

    spyOn(this.view, '_onToggleEdition');

    this.view.render();
  });

  afterEach(function () {
    this.view.clean();
  });

  it('should render properly', function () {
    expect(this.view.$('.Options-bar').length).toBe(1);
    expect(this.view.$('.js-input').length).toBe(1);
    expect(this.view.$('.js-input:checked').length).toBe(0);
    expect(this.view.$('.js-previewMap').length).toBe(1);
    expect(this.view.$('.js-createMap').length).toBe(1);
  });

  it('should render properly when edition', function () {
    var content = this.view._codemirrorModel.get('content');
    this.editorModel.set('edition', true);
    expect(this.view.$('.Dataset-codemirror').length).toBe(1);
    expect(content).toContain('table_1');
  });

  it('should not apply an empty query', function () {
    this.view._codemirrorModel.set('content', '');
    this.view._parseSQL();
    expect(this.querySchemaModel.fetch).not.toHaveBeenCalled();
  });

  it('should fetch geometry when a query is applied', function () {
    this.view._codemirrorModel.set('content', 'select * from whatever');
    this.view._parseSQL();
    expect(this.queryGeometryModel.get('simple_geom')).toBe('');
    expect(this.queryGeometryModel.get('query')).toBe('select * from whatever');
    expect(this.queryGeometryModel.fetch).toHaveBeenCalled();
  });

  it('should remove ; character from the query if it is in the last position', function () {
    this.view._codemirrorModel.set('content', 'select * from whatever;');
    this.view._parseSQL();
    expect(this.view._codemirrorModel.get('content')).toBe('select * from whatever');
    expect(this.querySchemaModel.fetch).toHaveBeenCalled();

    this.view._codemirrorModel.set('content', 'select * from whatever; hello');
    this.view._parseSQL();
    expect(this.view._codemirrorModel.get('content')).toBe('select * from whatever; hello');
  });

  it('should render preview button if geometry exists', function () {
    this.queryGeometryModel.set('simple_geom', 'polygon');
    this.querySchemaModel.columnsCollection.reset([{
      name: 'the_geom_webmercator'
    }]);
    this.view.render();

    expect(this.view.$('.js-previewMap').length).toBe(1);
  });

  it('should respond to change dataset name', function () {
    spyOn(this.view, '_parseSQL');
    this.analysisDefinitionNodeModel.setTableName('foo'); // This happens in another view (dataset-header-view)
    this.visModel.set('name', 'foo');
    expect(DatasetOptionsView.prototype._onChangeName).toHaveBeenCalled();
    expect(this.view._parseSQL).not.toHaveBeenCalled();

    var content = this.view._codemirrorModel.get('content');
    expect(content).toContain('foo');
    expect(content).not.toContain('table_1');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('._onChangeEdition', function () {
    it('should call _onToggleEdition', function () {
      this.view._onChangeEdition();
      expect(this.view._onToggleEdition).toHaveBeenCalled();
    });
  });

  describe('._parseSQL', function () {
    beforeEach(function () {
      this.view._codemirrorModel.set('content', 'UPDATE test SET name = \'test\'');
    });

    it('should set loading to true when called', function () {
      spyOn(this.view, '_SQL');
      this.view._parseSQL();

      expect(this.view._applyButtonStatusModel.get('loading')).toBe(true);
    });

    it('should set loading to false when in success callback', function () {
      spyOn(this.view._SQL, 'execute').and.callFake(function (query, a, options) {
        options.success();
      });

      this.view._parseSQL();

      expect(this.view._applyButtonStatusModel.get('loading')).toBe(false);
    });

    it('should set loading to false when in error callback', function () {
      spyOn(this.view._SQL, 'execute').and.callFake(function (query, a, options) {
        options.error({
          responseJSON: {}
        });
      });

      this.view._parseSQL();

      expect(this.view._applyButtonStatusModel.get('loading')).toBe(false);
    });
  });
});
