var Backbone = require('backbone');
var ConfigModel = require('builder/data/config-model');
var AnalysisDefinitionNodessCollection = require('builder/data/analysis-definition-nodes-collection');
var LayerDefinitionsCollection = require('builder/data/layer-definitions-collection');
var AddAnalysisView = require('builder/components/modals/add-analysis/add-analysis-view');
var UserModel = require('builder/data/user-model');
var DataServicesApiCheck = require('builder/editor/layers/layer-content-views/analyses/analyses-quota/analyses-quota-info');
var Router = require('builder/routes/router');

describe('components/modals/add-analysis/add-analysis-view', function () {
  beforeEach(function () {
    this.modalModel = new Backbone.Model();
    spyOn(this.modalModel, 'destroy');
    spyOn(Router, 'navigate');

    var configModel = new ConfigModel({
      base_url: '/u/pepe',
      user_name: 'foo',
      sql_api_template: 'foo',
      api_key: 'foo'
    });

    var userModel = new UserModel({}, {
      configModel: configModel
    });

    this.analysisDefinitionNodesCollection = new AnalysisDefinitionNodessCollection(null, {
      configModel: configModel,
      userModel: userModel
    });
    this.a0 = this.analysisDefinitionNodesCollection.add({
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * from alice'
      },
      options: {
        table_name: 'alice'
      }
    });
    this.layerDefinitionsCollection = new LayerDefinitionsCollection(null, {
      configModel: configModel,
      userModel: userModel,
      analysisDefinitionNodesCollection: this.analysisDefinitionNodesCollection,
      mapId: '123',
      stateDefinitionModel: new Backbone.Model()
    });
    this.layerA = this.layerDefinitionsCollection.add({
      id: 'layerA',
      kind: 'carto',
      options: {
        source: 'a0',
        table_name: 'alice'
      }
    });

    DataServicesApiCheck.get(configModel)._state = 'fetched';

    this.queryGeometryModel = this.a0.queryGeometryModel;
    spyOn(this.queryGeometryModel, 'sync');
    spyOn(this.queryGeometryModel, 'fetch').and.callThrough();

    this.view = new AddAnalysisView({
      configModel: configModel,
      userModel: userModel,
      modalModel: this.modalModel,
      layerDefinitionModel: this.layerA
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the loading view', function () {
    expect(this.view.$el.html()).toContain('loading');
  });

  describe('when geometry output type is fetched', function () {
    beforeEach(function () {
      this.queryGeometryModel.set('simple_geom', 'polygon');
      this.queryGeometryModel.sync.calls.argsFor(0)[2].success({
        fields: {},
        rows: []
      });
    });

    it('should render the content view', function () {
      expect(this.view.$el.html()).not.toContain('loading');
      expect(this.view.$el.html()).not.toContain('error');
    });

    it('should render the tabs', function () {
      expect(this.view.$('.js-menu li').size()).toBe(4);
      expect(this.view.$('.js-menu li:eq(0) button').html()).toContain('analysis-category.all');
      expect(this.view.$('.js-menu li:eq(1) button').html()).toContain('analysis-category.create-clean');
      expect(this.view.$('.js-menu li:eq(2) button').html()).toContain('analysis-category.analyze-predict');
      expect(this.view.$('.js-menu li:eq(3) button').html()).toContain('analysis-category.data-transformation');
    });

    describe('when click add when there is no selection', function () {
      it('should do nothing', function () {
        this.view.$('.js-add').click();
        expect(this.modalModel.destroy).not.toHaveBeenCalled();
      });
    });

    describe('when an option is selected', function () {
      beforeEach(function () {
        expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(true);
        var $el = this.view.$('[title*=georeference]').first();
        expect($el.length).toEqual(1, 'should only click one item (the custom georeference one)');

        $el.click();
      });

      it('should enable add-button', function () {
        expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(false);
      });

      describe('when click add', function () {
        beforeEach(function () {
          this.view.$('.js-add').click();
        });

        it('should destroy the modal and pass the created node model', function () {
          expect(this.modalModel.destroy).toHaveBeenCalled();
          expect(this.modalModel.destroy.calls.argsFor(0)).toEqual([
            jasmine.objectContaining({
              id: 'a1',
              source: 'a0',
              type: jasmine.any(String)
            })
          ]);
        });
      });
    });
  });
});
