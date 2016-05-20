var _ = require('underscore');
var cdb = require('cartodb.js');
var AnalysisDefinitionNodeModel = require('../../../../../../javascripts/cartodb3/data/analysis-definition-node-model');
var LayerDefinitionModel = require('../../../../../../javascripts/cartodb3/data/layer-definition-model');
var AnalysesView = require('../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/analyses-view');
var ConfigModel = require('../../../../../../javascripts/cartodb3/data/config-model');
var ModalsService = require('../../../../../../javascripts/cartodb3/components/modals/modals-service-model');

describe('editor/layers/layer-content-view/analyses-view', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });

    this.layerDefinitionModel = new LayerDefinitionModel({
      id: 'l-1',
      options: {
        type: 'CartoDB',
        table_name: 'foo',
        cartocss: 'asd',
        source: 'a1'
      }
    }, {
      configModel: this.configModel,
      collection: new cdb.Backbone.Collection()
    });
    this.a0 = new AnalysisDefinitionNodeModel({
      id: 'a0',
      type: 'source',
      table_name: 'foo'
    }, {
      configModel: this.configModel,
      collection: new cdb.Backbone.Collection()
    });
    spyOn(this.layerDefinitionModel, 'getAnalysisDefinitionNodeModel').and.returnValue(this.a0);

    this.modals = new ModalsService();

    var analysis = jasmine.createSpyObj('vis.analysis', ['findNodeById']);
    analysis.findNodeById.and.returnValue(new cdb.core.Model());

    this.view = new AnalysesView({
      layerDefinitionModel: this.layerDefinitionModel,
      modals: this.modals,
      analysis: analysis
    });
    this.view.render();
  });

  describe('render', function () {
    describe('when layer has no analysis', function () {
      it('should render placeholder view', function () {
        expect(this.view.$('.js-new-analysis').length).toBe(1);
      });

      it('should not render other view', function () {
        expect(_.size(this.view._subviews)).toBe(0);
      });

      describe('when click new-analysis', function () {
        beforeEach(function () {
          spyOn(this.modals, 'create').and.callThrough();
          this.view.$('.js-new-analysis').click();
        });

        afterEach(function () {
          this.modals.destroy();
        });

        it('should open modal to add analysis', function () {
          expect(this.modals.create).toHaveBeenCalled();
        });

        it('should not have any leaks', function () {
          expect(this.view).toHaveNoLeaks();
        });
      });
    });

    describe('when an analysis node is added on layer definition', function () {
      beforeEach(function () {
        this.a1 = new AnalysisDefinitionNodeModel({
          id: 'a1',
          type: 'trade-area',
          kind: 'walk',
          time: '100'
        }, {
          configModel: this.configModel,
          collection: new cdb.Backbone.Collection()
        });
        spyOn(this.a1, 'getPrimarySource').and.returnValue(this.a0);
        this.layerDefinitionModel.getAnalysisDefinitionNodeModel.and.returnValue(this.a1);
        this.layerDefinitionModel.set('source', 'a1');
      });

      it('should render workflow and analysis form views', function () {
        expect(_.size(this.view._subviews)).toBe(2);
        expect(this.view.$('.js-new-analysis').length).toBe(0);
      });

      it('should select the new node', function () {
        expect(this.view.viewModel.get('selectedNode').id).toEqual('a1');
      });

      it('should not have any leaks', function () {
        expect(this.view).toHaveNoLeaks();
      });
    });
  });
});
