var cdb = require('cartodb.js');
var AddAnalysisView = require('../../../../../../javascripts/cartodb3/components/modals/add-analysis/add-analysis-view');

describe('components/modals/add-analysis/add-analysis-view', function () {
  var FETCHING_TITLE = 'fetching-';

  beforeEach(function () {
    this.modalModel = new cdb.core.Model();
    spyOn(this.modalModel, 'destroy');

    this.view = new AddAnalysisView({
      modalModel: this.modalModel,
      analysisDefinitionNodeModel: {}
    });
    this.view.render();
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the content view', function () {
    expect(this.view.$('.js-body').html()).not.toContain(FETCHING_TITLE);
  });

  describe('when click add', function () {
    it('should do nothing if there is no selection', function () {
      this.view.$('.js-add').click();
      expect(this.modalModel.destroy).not.toHaveBeenCalled();
    });
  });
});
