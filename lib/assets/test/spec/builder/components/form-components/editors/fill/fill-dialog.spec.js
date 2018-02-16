var _ = require('underscore');
var FillDialogModel = require('builder/components/form-components/editors/fill/fill-dialog-model');
var FillDialogView = require('builder/components/form-components/editors/fill/fill-dialog');

describe('components/form-components/editors/fill/fill-dialog', function () {
  var view, model;

  var createViewFn = function () {
    model = new FillDialogModel({});

    var view = new FillDialogView(({
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
