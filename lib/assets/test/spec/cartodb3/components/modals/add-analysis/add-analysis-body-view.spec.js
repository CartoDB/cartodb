var cdb = require('cartodb.js');
var AddAnalysisBodyView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-body-view');
var AnalysisOptionsCollection = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/analysis-options-collection');

describe('components/modals/add-analysis/add-analysis-body-view', function () {
  beforeEach(function () {
    this.modalModel = new cdb.core.Model();
    spyOn(this.modalModel, 'destroy');

    this.collection = new AnalysisOptionsCollection([
      {
        title: 'first',
        sub_title: 'category',
        desc: 'describing what the option does',
        selected: false
      }
    ]);

    this.view = new AddAnalysisBodyView({
      collection: this.collection
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('when clicked', function () {
    beforeEach(function () {
      this.view.$el.children().first().click();
    });

    it('should select the model', function () {
      expect(this.collection.first().get('selected')).toBe(true);
    });
  });
});
