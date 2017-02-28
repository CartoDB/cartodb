var Backbone = require('backbone');
var _ = require('underscore');
var View = require('../../../../../../..//javascripts/cartodb3/components/onboardings/layers/data-onboarding/data-onboarding-view');
var helper = require('../../onboarding-tests-helper');

describe('components/onboardings/layers/data-onboarding/data-onboarding-view', function () {
  describe('initialize', function () {
    function testConstructorFn (opts) {
      var self = this;
      return function wrappedConstructor () {
        self.view = new View(opts);
      };
    }

    it('should get proper initialization', function () {
      var testConstructor = testConstructorFn.bind(this);
      var options = {
        onboardingNotification: {},
        editorModel: new Backbone.Model({}),
        notificationKey: 'data-key'
      };

      var constructor = testConstructor(options);
      expect(constructor).toThrowError('selector is required');

      testConstructor(options = _.extend(options, {
        selector: 'LayerOnboarding'
      }))();
      expect(this.view._numberOfSteps).toBe(4);
      expect(this.view._modifier).toEqual('--data');
    });
  });

  describe('render', function () {
    function assertTextFn (view, selector, expectedText) {
      var text = view.$(selector).text().trim();
      if (text !== expectedText) {
        throw new Error('Expected "' + selector + '" to have text "' + expectedText + '"');
      }
    }

    function assertClassesFn (view, selector, expectedClasses) {
      _.each(expectedClasses, function (expectedClass) {
        if (!view.$(selector).hasClass(expectedClass)) {
          throw new Error('Expected "' + selector + '" to have class "' + expectedClass + '"');
        }
      });
    }

    it('should get the proper template', function () {
      var options = {
        onboardingNotification: {},
        editorModel: new Backbone.Model({}),
        notificationKey: 'data-key',
        numberOfWidgets: 2,
        selector: 'LayerOnboarding'
      };
      this.view = new View(options);
      var assertClasses = assertClassesFn.bind(this, this.view);
      var assertText = assertTextFn.bind(this, this.view);
      var editorPanel = helper.addElement('js-editorPanel', 40, 50, 60, 70);
      this.view.render();
      var onboardingContainer = helper.createOnboardingContainer(this.view.$el[0]);

      assertClasses('.LayerOnboarding-body', ['is-step0', 'js-step']);
      assertText('.LayerOnboarding-step.is-step1 .LayerOnboarding-headerText', 'data-onboarding.layer-options.title');
      assertText('.LayerOnboarding-step.is-step1 .LayerOnboarding-description', 'data-onboarding.layer-options.description');
      assertText('.LayerOnboarding-step.is-step2 .LayerOnboarding-headerText', 'data-onboarding.data-tab.title');
      assertText('.LayerOnboarding-step.is-step2 .LayerOnboarding-description', 'data-onboarding.data-tab.description');
      assertText('.LayerOnboarding-step.is-step3 .LayerOnboarding-headerText', 'data-onboarding.sql-editor.title');
      assertText('.LayerOnboarding-step.is-step3 .LayerOnboarding-description', 'data-onboarding.sql-editor.description');
      assertClasses('.LayerOnboarding-body .LayerOnboarding-footer', ['is-step1', 'is-step2', 'is-step3']);
      assertText('.LayerOnboarding-pads--left .LayerOnboarding-footer.is-step1 .js-close span', 'data-onboarding.exit');
      assertText('.LayerOnboarding-pads--left .LayerOnboarding-footer.is-step1 .js-next span', 'data-onboarding.next');
      assertText('.LayerOnboarding-pads--left .LayerOnboarding-footer.is-step4 .js-close span', 'data-onboarding.add-geometry.edit-layer');

      // Content wrapper
      assertClasses('.LayerOnboarding-contentWrapper', ['is-step0', 'js-step']);
      assertClasses('.LayerOnboarding-contentWrapper .LayerOnboarding-contentBody', ['is-step0', 'js-step']);
      assertClasses('.LayerOnboarding-contentWrapper .LayerOnboarding-header', ['is-step0']);
      assertText('.LayerOnboarding-contentWrapper .LayerOnboarding-headerTitle', 'data-onboarding.title');
      assertText('.LayerOnboarding-contentWrapper .LayerOnboarding-footerButtons .js-start span', 'data-onboarding.take-tour');
      assertText('.LayerOnboarding-contentWrapper .LayerOnboarding-footerButtons .js-close span', 'data-onboarding.edit-layer');
      assertClasses('.LayerOnboarding-contentWrapper .LayerOnboarding-footer', ['is-step0']);
      assertClasses('.LayerOnboarding-contentWrapper .LayerOnboarding-footer .u-iBlock', ['is-step1']);
      expect(this.view.$('.LayerOnboarding-contentWrapper .LayerOnboarding-footer input').length).toBe(1);
      assertText('.LayerOnboarding-contentWrapper .LayerOnboarding-footer .u-iBlock label', 'style-onboarding.never-show-message');

      document.body.removeChild(onboardingContainer);
      document.body.removeChild(editorPanel);
    });
  });
});
