var _ = require('underscore');
var Backbone = require('backbone');
var PrivacyWarningView = require('builder/components/modals/privacy-warning/privacy-warning-view');

describe('components/modals/privacy-warning/privacy-warning-view', function () {
  var view;

  var createViewFn = function (viewOptions) {
    var modals = new Backbone.Model();

    var view = new PrivacyWarningView(
      _.extend({
        modalModel: modals
      }, viewOptions)
    );

    return view;
  };

  afterEach(function () {
    if (view) view.clean();
  });

  it('should render properly', function () {
    var visualizationView = createViewFn();
    visualizationView.render();

    expect(visualizationView.$('h2').text()).toContain('components.modals.privacy-warning.title.visualization');
    expect(visualizationView.$('p').text()).toContain('components.modals.privacy-warning.description');
    expect(visualizationView.$('.js-cancel').text()).toContain('components.modals.privacy-warning.cancel');
    expect(visualizationView.$('.js-confirm').text()).toContain('components.modals.privacy-warning.confirm');

    var datasetView = createViewFn({
      type: 'dataset'
    });
    datasetView.render();

    expect(datasetView.$('h2').text()).toContain('components.modals.privacy-warning.title.dataset');

    visualizationView.clean();
    datasetView.clean();
  });

  it('should invoke confirm callback when clicking confirm', function () {
    var confirmCallbackSpy = jasmine.createSpy();

    view = createViewFn({
      onConfirm: confirmCallbackSpy
    });
    view.render();

    view.$('.js-confirm').click();

    expect(confirmCallbackSpy).toHaveBeenCalled();
  });

  it('should invoke cancel callback when dismissing the modal', function () {
    var dismissCallbackSpy = jasmine.createSpy();

    view = createViewFn({
      onDismiss: dismissCallbackSpy
    });
    view.render();

    view.$('.js-cancel').click();

    expect(dismissCallbackSpy).toHaveBeenCalled();
  });
});
