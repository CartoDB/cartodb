var Backbone = require('backbone');
var BuilderOnboardingLauncher = require('../../../../../../javascripts/cartodb3/components/onboardings/builder/launcher');
var OnboardingsServiceModel = require('../../../../../../javascripts/cartodb3/components/onboardings/onboardings-service-model');
var GeoreferenceOnboardingLauncher = require('../../../../../../javascripts/cartodb3/components/onboardings/georeference/georeference-launcher');

describe('components/onboardings/builder/builder-launcher', function () {
  describe('constructor', function () {
    function testConstructorFn (launcherOpts) {
      return function wrappedConstructor () {
        BuilderOnboardingLauncher.init(launcherOpts);
      };
    }

    var testConstructor = testConstructorFn.bind(this);

    it('should fail if no mandatory options are provided', function () {
      var constructor = testConstructor({});
      expect(constructor).toThrowError('onboardings is required');

      constructor = testConstructor({
        onboardings: {}
      });
      expect(constructor).toThrowError('userModel is required');

      constructor = testConstructor({
        onboardings: {},
        userModel: {}
      });
      expect(constructor).toThrowError('onboardingNotification is required');

      constructor = testConstructor({
        onboardings: {},
        userModel: {},
        onboardingNotification: {}
      });
      expect(constructor).toThrowError('editorModel is required');

      constructor = testConstructor({
        onboardings: {},
        userModel: {},
        onboardingNotification: {},
        editorModel: {}
      });
    });
  });

  describe('.launch', function () {
    it('should launch georeference onboarding if builder onboarding has been skipped', function () {
      // Arrange
      var onboardings = jasmine.createSpyObj('onboardings', ['create']);
      var onboardingNotification = {
        getKey: function () { return true; }
      };

      BuilderOnboardingLauncher.init({
        onboardings: onboardings,
        userModel: {},
        editorModel: {},
        onboardingNotification: onboardingNotification
      });

      spyOn(GeoreferenceOnboardingLauncher, 'findNonGeoreferencedLayer');

      // Act
      BuilderOnboardingLauncher.launch();

      // Assert
      expect(onboardings.create).not.toHaveBeenCalled();
      expect(GeoreferenceOnboardingLauncher.findNonGeoreferencedLayer).toHaveBeenCalled();
    });

    it('should return view with proper arguments if onboarding is active', function () {
      // Arrange
      var onboardings = new OnboardingsServiceModel();
      var userModel = new Backbone.Model({
        username: 'pepe'
      });
      var editorModel = new Backbone.Model();
      var onboardingNotification = {
        getKey: function () { return false; }
      };

      BuilderOnboardingLauncher.init({
        onboardings: onboardings,
        userModel: userModel,
        editorModel: editorModel,
        onboardingNotification: onboardingNotification
      });

      // Act
      BuilderOnboardingLauncher.launch();

      // Assert
      expect(onboardings._onboardingView).toBeDefined();

      // Cleaning
      onboardings._onboardingView.remove();
      onboardings.destroy();
    });
  });
});
