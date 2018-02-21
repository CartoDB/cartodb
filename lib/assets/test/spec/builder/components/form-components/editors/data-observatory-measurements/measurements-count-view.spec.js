var Backbone = require('backbone');
var DataObservatoryCountView = require('builder/components/form-components/editors/data-observatory-measurements//measurements-count-view');

describe('components/form-components/editors/data-observatory-measurements/measurements-count-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      query: null,
      items: 50,
      filtering: false
    });

    this.view = new DataObservatoryCountView({
      model: this.model
    });
  });

  it('should render top results if query is empty', function () {
    this.model.set({
      query: '',
      items: 0
    });

    expect(this.view.$el.html()).toContain('analyses.data-observatory-measure.count.suggested');
  });

  it('should render number of results if query is not empty', function () {
    this.view.model.set({
      query: 'foo',
      items: 35
    });

    expect(this.view.$el.html()).toContain('analyses.data-observatory-measure.count.search');
  });

  it('should render number of results if query is not empty', function () {
    this.view.model.set({
      query: 'foo',
      items: 15,
      filtering: true
    });

    expect(this.view.$el.html()).toContain('analyses.data-observatory-measure.count.search');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
