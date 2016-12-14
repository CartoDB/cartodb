var EditFeatureHeaderView = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-header-view');

describe('editor/layers/edit-feature-content-views/edit-feature-header-view', function () {
  beforeEach(function () {
    this.model = {
      getFeatureType: function () { return 'line'; }
    };

    this.view = new EditFeatureHeaderView({
      url: 'http://',
      tableName: 'foo',
      model: this.model,
      modals: {},
      isNew: false,
      backAction: function () {}
    });

    this.view.render();
  });

  it('should render title, and tableName with url', function () {
    expect(this.view.$el.text()).toContain('client-template');
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});

