var Backbone = require('backbone');
var cdb = require('cartodb.js');
var AnalysisInfoPane = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-info-pane');

fdescribe('components/modals/add-analysis/analysis-info-pane', function () {
  beforeEach(function () {
    this.view = new AnalysisInfoPane({
      stackLayoutModel: new cdb.core.Model(),
      modalModel: new cdb.core.Model(),
      layerDefinitionModel: new cdb.core.Model(),
      collection: new Backbone.Collection([
        { selected: true,
          title: 'Intersection',
          category: 'category-name',
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
    expect(this.view.$el.html()).toContain('analysis-category.category-name');
    expect(this.view.$('.Analysis-moreInfoTitle').text()).toContain('analysis-category.intersection');
    expect(this.view.$('.Analysis-moreInfo p').text()).toContain('analyses-onboarding.intersection.description');
  });

  it('should render the breadcrumb', function () {
    expect(this.view.$('.CDB-NavMenu-inner li:nth-child(1)').text()).toContain('analysis-category.all');
    expect(this.view.$('.CDB-NavMenu-inner li:nth-child(2)').text()).toContain('analysis-category.intersection');
    expect(this.view.$('.CDB-NavMenu-inner li:nth-child(3)').text()).toContain('Intersection');
  });

  it('should triggger a back to category event', function () {
    var category;

    this.view.bind('backToCategory', function (categoryName) {
      category = categoryName;
    }, this);

    this.view.$('.js-backToCategory').click();
    expect(category).toBe('intersection');
  });
});
