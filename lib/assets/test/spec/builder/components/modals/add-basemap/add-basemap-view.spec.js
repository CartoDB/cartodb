var AddBasemapView = require('builder/components/modals/add-basemap/add-basemap-view');
var AddBasemapModel = require('builder/components/modals/add-basemap/add-basemap-model');
var BasemapsCollection = require('builder/editor/layers/basemap-content-views/basemaps-collection');
var CustomBaselayersCollection = require('builder/data/custom-baselayers-collection');
var ConfigModel = require('builder/data/config-model');
var UserModel = require('builder/data/user-model');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AnalysisDefinitionNodesCollection = require('builder/data/analysis-definition-nodes-collection');
var ModalViewModel = require('builder/components/modals/modal-view-model');

describe('components/modals/add-basemap/add-basemap-view', function () {
  beforeEach(function () {
    this.createContentViewResult = {};
    this.createContentView = jasmine.createSpy('createContentView').and.returnValue(this.createContentViewResult);
    spyOn(ModalViewModel.prototype, 'destroy').and.callThrough();
    this.modalModel = new ModalViewModel({
      createContentView: this.createContentView
    });

    var configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel,
      userModel: userModel
    });

    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: 'm-123',
      stateDefinitionModel: {}
    });
    this.layerDefinitionsCollection.add({
      id: 'l-1',
      kind: 'carto',
      options: {
        table_name: 'foo',
        className: 'positron_rainbow',
        category: 'CARTO'
      }
    });

    this.customBaselayersCollection = new CustomBaselayersCollection([{
      id: 'basemap-id-1',
      options: {
        urlTemplate: '',
        category: 'Custom'
      }
    }], {
      configModel: configModel,
      currentUserId: 'current-user-id'
    });

    this.model = new AddBasemapModel({}, {
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      basemapsCollection: new BasemapsCollection(),
      customBaselayersCollection: this.customBaselayersCollection
    });

    this.view = new AddBasemapView({
      modalModel: this.modalModel,
      layerDefinitionsCollection: this.layerDefinitionsCollection,
      createModel: this.model
    });

    this.view.render();
  });

  it('should render the tabs', function () {
    expect(this.innerHTML()).toContain('XYZ');
  });

  it('should start on XYZ view', function () {
    expect(this.innerHTML()).toContain('components.modals.add-basemap.xyz.insert');
  });

  it('should highlight the selected tab', function () {
    expect(this.view.$('.Modal-navigation .is-selected button').data('name')).toBe('xyz');
    expect(this.view.$('.Modal-navigation .is-selected button').data('name')).not.toBe('mapbox');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when clicking on a tab', function () {
    beforeEach(function () {
      this.view.$('button[data-name="mapbox"]').click();
    });

    it('should change tab', function () {
      expect(this.innerHTML()).toContain('components.modals.add-basemap.mapbox.insert');
    });

    it('should highlight new tab', function () {
      expect(this.view.$('.Modal-navigation .is-selected button').data('name')).toBe('mapbox');
      expect(this.view.$('.Modal-navigation .is-selected button').data('name')).not.toBe('xyz');
    });
  });

  describe('when click OK', function () {
    beforeEach(function () {
      spyOn(this.view._createModel, 'canSaveBasemap').and.returnValue(true);
      spyOn(this.view._createModel, 'saveBasemap');
      this.view.$('.js-ok').click();
    });

    it('should save new basemap', function () {
      expect(this.view._createModel.saveBasemap).toHaveBeenCalled();
    });

    describe('when save succeeds', function () {
      it('should close view', function () {
        this.view._createModel.trigger('saveBasemapDone');
        expect(ModalViewModel.prototype.destroy).toHaveBeenCalled();
      });
    });

    describe('when save fails', function () {
      beforeEach(function () {
        this.view._createModel.set('contentPane', 'addBasemapFailed');
      });

      it('should show an error explanation', function () {
        expect(this.innerHTML()).toContain('error');
      });
    });
  });

  afterEach(function () {
    this.view.clean();
  });
});
