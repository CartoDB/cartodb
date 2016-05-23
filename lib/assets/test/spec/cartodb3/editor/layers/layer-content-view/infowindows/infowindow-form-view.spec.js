var InfowindowFormView = require('../../../../../../../javascripts/cartodb3/editor/layers/layer-content-views/infowindow/infowindow-form-view.js');

describe('editor/layers/layer-content-view/infowindows/infowindow-form-view', function () {
  var view;

  beforeEach(function () {
    view = new InfowindowFormView({
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

