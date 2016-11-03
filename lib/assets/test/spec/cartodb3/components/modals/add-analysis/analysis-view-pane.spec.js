var Backbone = require('backbone');
var cdb = require('cartodb.js');
var AnalysisViewPane = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-view-pane');
var AnalysisOptionModel = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-option-models/analysis-option-model');

describe('components/modals/add-analysis/analysis-info-pane', function () {
  beforeEach(function () {
    this._analysisOptionsCollection = new Backbone.Collection([
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

    this.view = new AnalysisViewPane({
      stackLayoutModel: new cdb.core.Model(),
      modalModel: new cdb.core.Model(),
      queryGeometryModel: new cdb.core.Model(),
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
      analysisOptionsCollection: this._analysisOptionsCollection,
      layerDefinitionModel: new cdb.core.Model(),
      collection: new Backbone.Collection([
        { selected: true,
          title: 'Intersection',
          category: 'analyze-predict',
          type: 'intersection',
          genericType: 'intersection',
          analysisParams: {}
        }
      ])
    });
    this.view.render();
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the info', function () {
    expect(this.view.$el.html()).toContain('analysis-category.create-clean');
    expect(this.view.$el.html()).toContain('analysis-category.analyze-predict');
    expect(this.view.$el.html()).toContain('analysis-category.data-transformation');
    expect(this.view.$('.js-add').hasClass('is-disabled')).toBeTruthy();
  });

  it('should go to tab item', function () {
    this._analysisOptionsCollection.at(0).set('selected', true);
    this.view.goToTabItem('create_clean');
    expect(this.view.$('.js-add').hasClass('is-disabled')).toBeFalsy();
  });
});
