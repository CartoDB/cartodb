var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var LegendsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legends-view');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../../javascripts/cartodb3/data/query-geometry-model');
var LegendDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/legends/legend-definitions-collection');
var LegendFactory = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-factory');
var LayerDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/layer-definitions-collection');
var LayerDefinitionModel = require('../../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var QueryRowsCollection = require('../../../../../../../javascripts/cartodb3/data/query-rows-collection');

describe('editor/layers/layer-content-view/legend/legends-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    this.querySchemaModel = new QuerySchemaModel({
      query: 'SELECT * FROM table',
      status: 'fetched'
    }, {
      configModel: {}
    });

    spyOn(this.querySchemaModel, 'fetch');

    this.queryGeometryModel = new QueryGeometryModel({
      query: 'SELECT * FROM table',
      status: 'fetched',
      simple_geom: 'point'
    }, {
      configModel: {}
    });
    spyOn(this.queryGeometryModel, 'fetch');

    this.mapDefModel = new Backbone.Model({
      legends: true
    });

    this.editorModel = new Backbone.Model({
      edition: false
    });
    this.editorModel.isEditing = function () { return false; };

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    this.a0 = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    });
    spyOn(this.a0, 'isCustomQueryApplied').and.returnValue(false);

    this.layerDefinitionCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm123',
      stateDefinitionModel: {}
    });
    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'abc-123',
      kind: 'carto',
      options: {
        type: 'CartoDB',
        color: '#FABADA',
        table_name: 'foo',
        query: 'SELECT * FROM foo',
        tile_style: 'asdasd',
        visible: true
      }
    }, {
      parse: true,
      configModel: this.configModel,
      collection: this.layerDefinitionCollection
    });
    spyOn(this.layerDefinitionModel, 'save');
    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);

    this.layerDefinitionModel.styleModel = new Backbone.Model({
      fill: {
        color: {
          fixed: '#892b27'
        }
      }
    });

    this.legendDefinitionsCollection = new LegendDefinitionsCollection(null, {
      configModel: {},
      layerDefinitionsCollection: new Backbone.Collection(),
      vizId: 'v-123'
    });

    LegendFactory.init(this.legendDefinitionsCollection);

    spyOn(LegendsView.prototype, '_changeStyle');

    this.queryRowsCollection = new QueryRowsCollection([], {
      configModel: this.configModel,
      querySchemaModel: this.querySchemaModel
    });

    this.view = new LegendsView({
      mapDefinitionModel: this.mapDefModel,
      layerDefinitionModel: this.layerDefinitionModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      editorModel: this.editorModel,
      querySchemaModel: this.querySchemaModel,
      queryGeometryModel: this.queryGeometryModel,
      queryRowsCollection: this.queryRowsCollection,
      userActions: {},
      userModel: this.userModel,
      configModel: this.configModel,
      modals: {}
    });

    this.view.render();
  });

  describe('.render', function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
        .andReturn({ status: 200 });
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should render loading when geometry is being fetched', function () {
      spyOn(this.queryGeometryModel, 'isFetching').and.returnValue(true);

      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0); // tabPane
      expect(this.view.$el.html()).toContain('FormPlaceholder');
    });

    it('should render sql error message', function () {
      this.view.modelView.set({state: 'error'});

      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$el.text()).toContain('editor.error-query.body');
    });

    it('should render no geometry placeholder when geometry is empty', function () {
      spyOn(this.queryGeometryModel, 'hasValue').and.returnValue(false);

      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0); // tabPane
      expect(this.view.$el.text()).toContain('editor.legend.no-geometry-data');
    });

    it('should render properly', function () {
      expect(_.size(this.view._subviews)).toBe(1); // tabPane
      expect(this.view.$el.text()).toContain('editor.legend.menu-tab-pane-labels.color');
      expect(this.view.$el.text()).toContain('editor.legend.menu-tab-pane-labels.size');
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('when layer is non georeferenced', function () {
    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(new RegExp('.*api/v2/sql.*'))
        .andReturn({
          status: 200,
          responseText: '{"rows":[{},{},{}]}'
        });

      spyOn(this.layerDefinitionModel, 'isCustomQueryApplied').and.returnValue(false);

      this.view = new LegendsView({
        mapDefinitionModel: this.mapDefModel,
        layerDefinitionModel: this.layerDefinitionModel,
        legendDefinitionsCollection: this.legendDefinitionsCollection,
        editorModel: this.editorModel,
        querySchemaModel: this.querySchemaModel,
        queryGeometryModel: this.queryGeometryModel,
        queryRowsCollection: this.queryRowsCollection,
        userActions: {},
        userModel: this.userModel,
        configModel: this.configModel,
        modals: {}
      });

      this.view.render();
    });

    afterEach(function () {
      jasmine.Ajax.uninstall();
    });

    it('should render placeholder', function () {
      expect(_.size(this.view._subviews)).toBe(1);
      expect(this.view.$('.CDB-Size-huge').length).toBe(0);

      this.queryGeometryModel.set('simple_geom', '');

      this.view.render();

      expect(_.size(this.view._subviews)).toBe(0);
      expect(this.view.$('.CDB-Size-huge').length).toBe(1);
      expect(this.view.$('.CDB-Size-huge').text()).toContain('editor.legend.no-geometry-data');
      expect(this.view.$('.CDB-Size-huge').text()).toContain('editor.layers.georeference.manually-add');
      expect(this.view.$('.CDB-Button-Text').text()).toBe('editor.layers.georeference.georeference-button');
    });

    it('should not have any leaks', function () {
      expect(this.view).toHaveNoLeaks();
    });
  });

  it('should bind events properly', function () {
    this.editorModel.set({edition: true});

    expect(LegendsView.prototype._changeStyle).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

