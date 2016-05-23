var InfowindowDescriptionView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-description-view.js');

describe('editor/layers/layer-content-view/infowindows/infowindow-description-view', function () {
  var view;

  beforeEach(function () {
    view = new InfowindowDescriptionView({
    });
  });

  it('should render states', function () {
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});

