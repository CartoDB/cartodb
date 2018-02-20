var Backbone = require('backbone');
var AnalysisViewPane = require('builder/components/modals/add-analysis/analysis-view-pane');
var AnalysisOptionModel = require('builder/components/modals/add-analysis/analysis-option-models/analysis-option-model');
var Router = require('builder/routes/router');

describe('components/modals/add-analysis/analysis-view-pane', function () {
  var view, analysisOptionsCollection;

  var createViewFn = function (options) {
    analysisOptionsCollection = new Backbone.Collection([
      new AnalysisOptionModel({
        category: 'create_clean',
        desc: 'Use street addresses, city names, or other location text to generate point geometries.',
        selected: false,
        title: 'Georeference',
        type: 'georeference-long-lat',
        type_group: ''
      }, {
        nodeAttrs: {
          type: 'georeference-long-lat'
        }
      }), new AnalysisOptionModel({
        category: 'analyze_predict',
        desc: 'Moran description',
        selected: false,
        title: 'Moran',
        type: 'moran',
        type_group: ''
      }, {
        nodeAttrs: {
          type: 'moran'
        }
      }), new AnalysisOptionModel({
        category: 'data_transformation',
        desc: 'Centroid description',
        selected: false,
        title: 'Centroid',
        type: 'centroid',
        type_group: ''
      }, {
        nodeAttrs: {
          type: 'centroid'
        }
      })
    ]);

    var view = new AnalysisViewPane({
      stackLayoutModel: new Backbone.Model(),
      modalModel: new Backbone.Model(),
      queryGeometryModel: new Backbone.Model(),
      analysisOptions: {
        create_clean: {
          title: 'Create and clean',
          analyses: [{
            desc: 'Use street addresses, city names, or other location text to generate point geometries.',
            nodeAttrs: {
              type: 'georeference-long-lat'
            },
            title: 'Georeference'
          }]
        },
        analyze_predict: {
          title: 'Analyze and predict',
          analyses: [{
            desc: 'Moran desc',
            nodeAttrs: {
              type: 'moran'
            },
            title: 'Moran'
          }]
        },
        data_transformation: {
          title: 'Data Transformation',
          analyses: [{
            desc: 'Centroid desc',
            nodeAttrs: {
              type: 'centroid'
            },
            title: 'Centroid'
          }]
        }
      },
      analysisOptionsCollection: analysisOptionsCollection,
      layerDefinitionModel: new Backbone.Model({
        id: 'some-layer-id',
        letter: 'a',
        source: 'a0'
      }),
      collection: new Backbone.Collection([
        { selected: true,
          id: 'a3',
          title: 'Intersection',
          category: 'analyze-predict',
          type: 'intersection',
          genericType: 'intersection',
          analysisParams: {}
        }
      ])
    });

    return view;
  };

  beforeEach(function () {
    spyOn(Router, 'navigate');

    view = createViewFn();
    view.render();
  });

  describe('.render', function () {
    it('should render properly', function () {
      expect(view.$el.html()).toContain('analysis-category.create-clean');
      expect(view.$el.html()).toContain('analysis-category.analyze-predict');
      expect(view.$el.html()).toContain('analysis-category.data-transformation');
      expect(view.$('.js-add').hasClass('is-disabled')).toBeTruthy();
    });

    it('should not have any leaks', function () {
      expect(view).toHaveNoLeaks();
    });
  });

  it('should go to tab item', function () {
    analysisOptionsCollection.at(0).set('selected', true);
    view.goToTabItem('create_clean');

    expect(view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
  });

  describe('._onAddAnalysis', function () {
    it('should call goToAnalysisNode', function () {
      spyOn(Router, 'goToAnalysisNode');

      analysisOptionsCollection.at(0).set('selected', true);
      view._onAddAnalysis();

      expect(Router.goToAnalysisNode).toHaveBeenCalledWith('some-layer-id', 'a1');
    });
  });
});
