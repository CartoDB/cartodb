var _ = require('underscore');
var DialogModel = require('builder/components/dialog/dialog-model');
var DialogView = require('builder/components/dialog/dialog-view');

describe('components/fill-dialog', function () {
  var view, model;

  var createViewFn = function () {
    model = new DialogModel({});

    var view = new DialogView(({
      model: model
    }));

    return view;
  };

  beforeEach(function () {
    view = createViewFn();
  });

  afterEach(function () {
    view.clean();
  });

  xit('should get rendered', function () {
    // TODO
  });

  it('should not have leaks', function () {
    view.render();
    expect(view).toHaveNoLeaks();
  });

  afterEach(function () {
    view.remove();
  });

  it('should render properly', function () {
    view.render();
    expect(_.size(view._subviews)).toBe(2);
  });
});
