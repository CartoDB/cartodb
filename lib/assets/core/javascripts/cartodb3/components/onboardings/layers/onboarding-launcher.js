var OnboardingLauncher = function (opts) {
  var _view;
  var _notificationKey;
  var _onboardings;
  var _userModel;
  var _onboardingNotification;
  var _editorModel;
  var _hasWidgets = false;

  if (!opts || !opts.view) {
    throw new Error('view is required');
  }

  if (!opts.notificationKey) {
    throw new Error('notificationKey is required');
  }

  if (!opts.onboardings) {
    throw new Error('onboardings is required');
  }

  if (!opts.userModel) {
    throw new Error('userModel is required');
  }

  if (!opts.onboardingNotification) {
    throw new Error('onboardingNotification is required');
  }

  _view = opts.view;
  _onboardings = opts.onboardings;
  _userModel = opts.userModel;
  _onboardingNotification = opts.onboardingNotification;
  _editorModel = opts.editorModel;
  _hasWidgets = opts.hasWidgets;

  return {
    launch: function () {
      // if (!onboardingNotification.getKey(_notificationKey)) {
        onboardings.create(function () {
          return new _view({
            userModel: _userModel,
            editorModel: _editorModel,
            onboardingNotification: _onboardingNotification,
            hasWidgets: _hasWidgets
          });
        });
      // }
    }
  };
};

module.exports = OnboardingLauncher;
