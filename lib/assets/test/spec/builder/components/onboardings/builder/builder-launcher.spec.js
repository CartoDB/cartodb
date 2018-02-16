var Backbone = require('backbone');
var BuilderOnboardingLauncher = require('builder/components/onboardings/builder/launcher');
var OnboardingsServiceModel = require('builder/components/onboardings/onboardings-service-model');

describe('components/onboardings/builder/builder-launcher', function () {
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

      // Act
      BuilderOnboardingLauncher.launch();

      // Assert
      expect(onboardings.create).not.toHaveBeenCalled();
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
