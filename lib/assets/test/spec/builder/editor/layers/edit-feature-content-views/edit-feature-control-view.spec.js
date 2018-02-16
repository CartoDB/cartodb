var EditFeatureControlView = require('builder/editor/layers/edit-feature-content-views/edit-feature-control-view');

describe('editor/layers/edit-feature-content-views/edit-feature-control-view', function () {
  beforeEach(function () {
    this.view = new EditFeatureControlView();
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$('.js-back').length).toBe(1);
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
