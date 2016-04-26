var cdb = require('cartodb.js');
var AddAnalysisView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysisDefinitionNodesCollection = require('../../../../../../javascripts/cartodb3/data/analysis-definition-nodes-collection');

describe('components/modals/add-analysis/add-analysis-view', function () {
  beforeEach(function () {
    this.modalModel = new cdb.core.Model();
    spyOn(this.modalModel, 'destroy');

    this.collection = new AnalysisDefinitionNodesCollection(null, {
      sqlAPI: {},
      configModel: {},
      vis: {}
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
    spyOn(this.analysisDefinitionNodeModel, 'asyncGetOutputGeometryType');

    this.layerDefinitionModel = new LayerDefinitionModel({}, {
      configModel: {}
    });

    this.nodeModel = {};
    spyOn(this.layerDefinitionModel, 'createNewAnalysisNode').and.returnValue(this.nodeModel);

    this.view = new AddAnalysisView({
      modalModel: this.modalModel,
      layerDefinitionModel: this.layerDefinitionModel,
      analysisDefinitionNodeModel: this.analysisDefinitionNodeModel
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the loading view', function () {
    expect(this.view.$('.js-body').html()).toContain('loading');
  });

  describe('when geometry output fails to be fetched', function () {
    beforeEach(function (done) {
      this.view.model.once('change', done);
      this.analysisDefinitionNodeModel.asyncGetOutputGeometryType.calls.argsFor(0)[0]('err');
    });

    it('should render error view', function () {
      expect(this.view.$('.js-body').html()).toContain('error');
      expect(this.view.$('.js-body').html()).not.toContain('loading');
    });
  });

  describe('when geometry output type is fetched', function () {
    beforeEach(function (done) {
      this.view.model.once('change', done);
      this.analysisDefinitionNodeModel.asyncGetOutputGeometryType.calls.argsFor(0)[0](null, 'polygon');
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
