var cdb = require('cartodb.js');
var geometry = require('../../../../../../javascripts/cartodb3/data/geometry');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');
var AddAnalysisView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');

describe('components/modals/add-analysis/add-analysis-view', function () {
  beforeEach(function () {
    this.modalModel = new cdb.core.Model();
    spyOn(this.modalModel, 'destroy');

    var configModel = new ConfigModel({
      base_url: '/pepe'
    });

    this.collection = new AnalysisDefinitionNodesCollection(null, {
      configModel: configModel
    });
    this.collection.add({
      id: 'a1',
      type: 'trade-area',
      params: {
        kind: 'walk',
        time: 300,
        source: {
          id: 'a0',
          type: 'source',
          params: {
            query: 'SELECT * FROM foo'
          }
        }
      }
    });
    this.analysisDefinitionNodeModel = this.collection.get('a1');
    this.querySchemaModel = this.analysisDefinitionNodeModel.querySchemaModel;
    this.querySchemaModel.set('query', 'SELECT * FROM something');
    spyOn(this.querySchemaModel, 'sync');
    spyOn(this.analysisDefinitionNodeModel.querySchemaModel, 'fetch').and.callThrough();

    this.layerDefinitionModel = new LayerDefinitionModel({}, {
      configModel: {}
    });

    this.nodeModel = {};
    spyOn(this.layerDefinitionModel, 'createNewAnalysisNode').and.returnValue(this.nodeModel);
    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.analysisDefinitionNodeModel);

    this.view = new AddAnalysisView({
      modalModel: this.modalModel,
      layerDefinitionModel: this.layerDefinitionModel
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the loading view', function () {
    expect(this.view.$('.js-body').html()).toContain('loading');
  });

  describe('when geometry output type is fetched', function () {
    beforeEach(function () {
      spyOn(this.querySchemaModel, 'getGeometry').and.returnValue(geometry('0101000020110F00003BA22311223219C13E88B17EF7CA5241'));
      this.querySchemaModel.sync.calls.argsFor(0)[2].success({
        fields: {},
        rows: []
      });
    });

    it('should render the content view', function () {
      expect(this.view.$('.js-body').html()).not.toContain('loading');
      expect(this.view.$('.js-body').html()).not.toContain('error');
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
        this.view.$('li').click();
      });

      it('should enable add-button', function () {
        expect(this.view.$('.js-add').hasClass('is-disabled')).toBe(false);
      });

      describe('when click add', function () {
        beforeEach(function () {
          this.view.$('.js-add').click();
        });

        it('should create a new analysis node', function () {
          expect(this.layerDefinitionModel.createNewAnalysisNode).toHaveBeenCalled();
          expect(this.layerDefinitionModel.createNewAnalysisNode.calls.argsFor(0)[0]).toEqual(jasmine.any(Object));
        });

        it('should destroy the modal and pass the created node model', function () {
          expect(this.modalModel.destroy).toHaveBeenCalled();
          expect(this.modalModel.destroy.calls.argsFor(0)).toEqual([this.nodeModel]);
        });
      });
    });
  });
});
