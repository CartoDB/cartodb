var InfowindowSelectView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-select-view.js');

describe('editor/layers/layer-content-view/infowindows/infowindow-select-view', function () {
  var view;

  beforeEach(function () {
    view = new InfowindowSelectView({
    });
  });

  it('should', function () {
  });

  it('should not have any leaks', function () {
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.clean();
  });
});

