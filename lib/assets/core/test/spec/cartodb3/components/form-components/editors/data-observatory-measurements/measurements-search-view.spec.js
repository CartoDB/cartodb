var Backbone = require('backbone');
var DataObservatorySearchView = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/data-observatory-measurements/measurements-search-view');

describe('components/form-components/editors/data-observatory-measurements/measurements-search-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      query: '',
      items: 50
    });

    this.view = new DataObservatorySearchView({
      model: this.model
    });
  });

  it('should sanitize input', function () {
    this.view.$('.js-input-search').val('<script>');
    expect(this.model.get('query')).toBe('');
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
