var Backbone = require('backbone');
var _ = require('underscore');
var ConfigModel = require('../../../../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../../../../javascripts/cartodb3/data/user-model');
var LegendsView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legends-view');
var QuerySchemaModel = require('../../../../../../../javascripts/cartodb3/data/query-schema-model');
var QueryGeometryModel = require('../../../../../../../javascripts/cartodb3/data/query-geometry-model');
var LegendDefinitionsCollection = require('../../../../../../../javascripts/cartodb3/data/legends/legend-definitions-collection');
var LegendFactory = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/legend/legend-factory');

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

    this.layerDefinitionModel = new Backbone.Model();

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

    this.view = new LegendsView({
      mapDefinitionModel: this.mapDefModel,
      layerDefinitionModel: this.layerDefinitionModel,
      legendDefinitionsCollection: this.legendDefinitionsCollection,
      editorModel: this.editorModel,
      querySchemaModel: this.querySchemaModel,
      queryGeometryModel: this.queryGeometryModel,
      userActions: {},
      userModel: this.userModel,
      configModel: this.configModel,
      modals: {}
    });

    this.view.render();
  });

  describe('render', function () {
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
  });

  it('should bind events properly', function () {
    this.editorModel.set({edition: true});
    expect(LegendsView.prototype._changeStyle).toHaveBeenCalled();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

