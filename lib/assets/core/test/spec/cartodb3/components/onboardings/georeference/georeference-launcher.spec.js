var Backbone = require('backbone');
var GeoreferenceOnboardingLauncher = require('../../../../../../javascripts/cartodb3/components/onboardings/georeference/georeference-launcher');
var OnboardingsServiceModel = require('../../../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');

describe('components/onboardings/georeference/georeference-launcher', function () {
  describe('constructor', function () {
    function testConstructorFn (launcherOpts) {
      return function wrappedConstructor () {
        new GeoreferenceOnboardingLauncher(launcherOpts); // eslint-disable-line
      };
    }

    var testConstructor = testConstructorFn.bind(this);

    it('should fail if no mandatory options are provided', function () {
      var constructor = testConstructor();
      expect(constructor).toThrowError('onboardingNotification is required');

      constructor = testConstructor({
        onboardingNotification: {}
      });
      expect(constructor).toThrowError('onboardings is required');
      constructor = testConstructor({
        onboardingNotification: {},
        onboardings: {}
      });
    });
  });

  describe('launch', function () {
    it('should do nothing if onboarding has been skipped', function () {
      var onboardingNotification = {
        getKey: function () { return true; }
      };
      var onboardings = jasmine.createSpyObj('onboardings', ['create']);
      var launcher = new GeoreferenceOnboardingLauncher({
        onboardingNotification: onboardingNotification,
        onboardings: onboardings
      });

      launcher.launch();

      expect(onboardings.create).not.toHaveBeenCalled();
    });

    it('should return view with proper arguments if onboarding is active', function () {
      // Arrange
      var onboardingNotification = {
        getKey: function () { return false; }
      };
      var onboardings = new OnboardingsServiceModel();
      var launcher = new GeoreferenceOnboardingLauncher({
        onboardingNotification: onboardingNotification,
        onboardings: onboardings
      });

      // Act
      launcher.launch({
        name: '',
        source: ''
      });

      // Assert
      expect(onboardings._onboardingView).toBeDefined();

      // Cleaning
      onboardings._onboardingView.remove();
      onboardings.destroy();
    });
  });
});
