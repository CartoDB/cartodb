var _ = require('underscore');
var Backbone = require('backbone');
var EditFeatureContentView = require('builder/editor/layers/edit-feature-content-view');
var MapModeModel = require('builder/map-mode-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var FeatureDefinitionModel = require('builder/data/feature-definition-model');
var EditorModel = require('builder/data/editor-model');
var ModalsService = require('builder/components/modals/modals-service-model');
var Stylehelper = require('builder/helpers/style');
var Router = require('builder/routes/router');

var QueryGeometryModelMock = function (simple_geom) {
  var geom = simple_geom || '';

  return {
    hasValueAsync: function () {
      return Promise.resolve(geom !== '');
    },
    resetFetch: function () {}
  };
};

describe('editor/layers/edit-feature-content-view', function () {
  beforeEach(function () {
    spyOn(Router, 'navigate');
    jasmine.Ajax.install();
    jasmine.Ajax.stubRequest(new RegExp('^http(s)?://.*tables.*'))
      .andReturn({ status: 200 });

    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });

    var analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel
    });

    var layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: this.configModel,
      userModel: this.userModel,
      analysisDefinitionNodesCollection: analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo'
      }
    });
    this.layerDefinitionModel = layerDefinitionsCollection.at(0);

    this.mapModeModel = new MapModeModel();
    this.editorModel = new EditorModel();
    this.mapStackLayoutModel = jasmine.createSpyObj('stackLayoutModel', ['prevStep', 'nextStep', 'goToStep']);
    this.modals = new ModalsService();

    this.rowCollection = {
      resetFetch: jasmine.createSpy('resetFetch')
    };

    var featureDefinition = new FeatureDefinitionModel({}, {
      configModel: this.configModel,
      layerDefinitionModel: this.layerDefinitionModel,
      userModel: this.userModel
    });
    this.mapModeModel.enterDrawingFeatureMode(featureDefinition);

    this.view = new EditFeatureContentView({
      layerDefinitionModel: this.layerDefinitionModel,
      configModel: this.configModel,
      stackLayoutModel: this.mapStackLayoutModel,
      mapModeModel: this.mapModeModel,
      editorModel: this.editorModel,
      model: new Backbone.Model({
        hasChanges: false,
        isValidAttributes: true,
        isValidGeometry: true
      }),
      modals: this.modals
    });
    spyOn(this.view, '_addRow').and.callThrough();
    spyOn(this.view, '_renderInfo').and.callThrough();

    this.view._rowsCollection = this.rowCollection;
    this.view.render();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should get table details', function () {
    expect(this.view._tableName).toBe('foo');
    expect(this.view._url).toBe('/u/pepe/dataset/foo');
  });

  it('should render properly', function () {
    expect(_.size(this.view._subviews)).toBe(2); // header, content
  });

  describe('when feature is new', function () {
    it('should add row', function () {
      expect(this.view._addRow).toHaveBeenCalled();
      expect(this.view._renderInfo).toHaveBeenCalled();
    });
  });

  describe('when feature already exists', function () {
    var view;

    beforeEach(function () {
      var featureDefinition = new FeatureDefinitionModel({
        cartodb_id: 1
      }, {
        configModel: this.configModel,
        layerDefinitionModel: this.layerDefinitionModel,
        userModel: this.userModel
      });
      featureDefinition.fetch();

      this.mapModeModel.enterEditingFeatureMode(featureDefinition);

      view = new EditFeatureContentView({
        layerDefinitionModel: this.layerDefinitionModel,
        configModel: this.configModel,
        stackLayoutModel: this.mapStackLayoutModel,
        mapModeModel: this.mapModeModel,
        editorModel: this.editorModel,
        model: new Backbone.Model({
          hasChanges: false
        }),
        modals: this.modals
      });
      spyOn(view, '_addRow').and.callThrough();
      spyOn(view, '_renderInfo').and.callThrough();

      view.render();
    });

    it('should not add row', function () {
      expect(view._addRow).not.toHaveBeenCalled();
      expect(view._renderInfo).toHaveBeenCalled();
    });
  });

  describe('._onDestroyFeatureSuccess', function () {
    it('should call `_onUpdateFeature`', function () {
      spyOn(this.view, '_onUpdateFeature').and.callThrough();
      spyOn(Router, 'goToStyleTab').and.callThrough();
      this.view.notification = {
        set: function () {}
      };
      spyOn(this.view.notification, 'set');

      this.view._onDestroyFeatureSuccess();

      expect(this.view._onUpdateFeature).toHaveBeenCalledWith('destroy');
      expect(this.view.notification.set).toHaveBeenCalled();
      expect(this.rowCollection.resetFetch).toHaveBeenCalled();
      expect(Router.goToStyleTab).toHaveBeenCalledWith(this.layerDefinitionModel.get('id'));
    });
  });

  describe('._onSaveFeatureSuccess', function () {
    it('should call `_onUpdateFeature`', function () {
      spyOn(this.view, '_onUpdateFeature').and.callThrough();
      spyOn(Router, 'editFeature');
      this.view.notification = {
        set: function () {}
      };
      spyOn(this.view.notification, 'set');

      this.view._onSaveFeatureSuccess('save');

      expect(this.view._onUpdateFeature).toHaveBeenCalled();
      expect(this.view.notification.set).toHaveBeenCalled();
      expect(this.rowCollection.resetFetch).not.toHaveBeenCalled();
      expect(Router.editFeature).toHaveBeenCalled();
    });
  });

  describe('._onUpdateFeature', function () {
    it('should reset fetch if saving and current geometry model does not have value', function (done) {
      var self = this;
      this.view._queryGeometryModel = new QueryGeometryModelMock();
      spyOn(this.view._queryGeometryModel, 'resetFetch');

      this.view._onUpdateFeature('save');

      setTimeout(function () {
        expect(self.view._queryGeometryModel.resetFetch).toHaveBeenCalled();
        expect(self.rowCollection.resetFetch).not.toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should not reset fetch if saving and current geometry model has value', function (done) {
      var self = this;
      this.view._queryGeometryModel = new QueryGeometryModelMock('polygon');
      spyOn(this.view._queryGeometryModel, 'resetFetch');
      this.view._onUpdateFeature('save');

      setTimeout(function () {
        expect(self.view._queryGeometryModel.resetFetch).not.toHaveBeenCalled();
        done();
      }, 200);
    });

    it('should reset fetch if destroying', function (done) {
      var self = this;
      this.view._queryGeometryModel = new QueryGeometryModelMock();
      spyOn(this.view._queryGeometryModel, 'resetFetch');

      this.view._onUpdateFeature('destroy');

      setTimeout(function () {
        expect(self.view._queryGeometryModel.resetFetch).toHaveBeenCalled();
        expect(self.rowCollection.resetFetch).toHaveBeenCalled();
        done();
      }, 200);
    });
  });

  describe('when `cancelPreviousEditions` is triggered from _editorModel', function () {
    it('should call clean method', function () {
      spyOn(this.view, 'clean');

      this.view._initBinds();
      this.view._editorModel.trigger('cancelPreviousEditions');

      expect(this.view.clean).toHaveBeenCalled();
    });
  });

  describe('reload vis', function () {
    beforeEach(function () {
      spyOn(Stylehelper, 'getColorAttribute');
      spyOn(Stylehelper, 'getSizeAttribute');
    });

    it('should reload vis if metadata changes and layer is styled but that attribute', function () {
      Stylehelper.getColorAttribute.and.returnValue('foo');
      Stylehelper.getSizeAttribute.and.returnValue(undefined);
      this.view._featureModel.set('foo', 10);

      expect(this.view._needReloadVis()).toBeTruthy();
    });

    it('should reload vis if metadata changes and layer is not styled but that attribute', function () {
      Stylehelper.getColorAttribute.and.returnValue('bar');
      Stylehelper.getSizeAttribute.and.returnValue(undefined);
      this.view._featureModel.set('foo', 10);

      expect(this.view._needReloadVis()).toBeFalsy();
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
