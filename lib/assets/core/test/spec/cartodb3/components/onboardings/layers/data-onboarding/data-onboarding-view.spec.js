var Backbone = require('backbone');
var _ = require('underscore');
var View = require('../../../../../../..//javascripts/cartodb3/components/onboardings/layers/data-onboarding/data-onboarding-view');

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
      expect(constructor).toThrowError('numberOfWidgets is required');

      constructor = testConstructor(options = _.extend(options, {
        numberOfWidgets: 0
      }));
      expect(constructor).toThrowError('hasTimeSeries is required');

      constructor = testConstructor(options = _.extend(options, {
        hasTimeSeries: false
      }));
      expect(constructor).toThrowError('hasAnimatedTimeSeries is required');

      testConstructor(options = _.extend(options, {
        hasAnimatedTimeSeries: false
      }))();
      expect(this.view._hasTimeSeries).toBe(false);
      expect(this.view._hasAnimatedTimeSeries).toBe(false);
      expect(this.view._numberOfSteps).toBe(4);
      expect(this.view._modifier).toEqual('--data');

      testConstructor(options = _.extend(options, {
        numberOfWidgets: 2,
        hasTimeSeries: true
      }))();
      expect(this.view._hasSidebarWidgets).toBe(true);

      testConstructor(options = _.extend(options, {
        numberOfWidgets: 1,
        hasTimeSeries: false
      }))();
      expect(this.view._hasSidebarWidgets).toBe(true);

      testConstructor(options = _.extend(options, {
        numberOfWidgets: 0,
        hasTimeSeries: false
      }))();
      expect(this.view._hasSidebarWidgets).toBe(false);
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
        hasTimeSeries: true,
        hasAnimatedTimeSeries: true
      };
      this.view = new View(options);
      var assertClasses = assertClassesFn.bind(this, this.view);
      var assertText = assertTextFn.bind(this, this.view);

      this.view.render();

      assertClasses('.LayerOnboarding-body', ['is-step0', 'js-step']);
      assertText('.LayerOnboarding-step.is-step1 .LayerOnboarding-headerText', 'data-onboarding.layer-options.title');
      assertText('.LayerOnboarding-step.is-step1 .LayerOnboarding-description', 'data-onboarding.layer-options.description');
      assertText('.LayerOnboarding-step.is-step2 .LayerOnboarding-headerText', 'data-onboarding.data-tab.title');
      assertText('.LayerOnboarding-step.is-step2 .LayerOnboarding-description', 'data-onboarding.data-tab.description');
      assertText('.LayerOnboarding-step.is-step3 .LayerOnboarding-headerText', 'data-onboarding.sql-editor.title');
      assertText('.LayerOnboarding-step.is-step3 .LayerOnboarding-description', 'data-onboarding.sql-editor.description');
      assertClasses('.LayerOnboarding-body .LayerOnboarding-footer', ['is-step1', 'is-step2', 'is-step3']);
      assertText('.LayerOnboarding-pads--left .js-close span', 'data-onboarding.exit');
      assertText('.LayerOnboarding-pads--left .js-next span', 'data-onboarding.next');

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

      // Pads on the right
      assertClasses('.LayerOnboarding-pads--right', ['is-step0', 'js-step']);
      assertClasses('.LayerOnboarding-pads--right .LayerOnboarding-padTop', ['has-timeSeries', 'has-timeSeries--animated', 'has-widgets']);
      assertClasses('.LayerOnboarding-pads--right .LayerOnboarding-padMiddle .LayerOnboarding-step', ['is-step4']);
      assertText('.LayerOnboarding-pads--right .LayerOnboarding-padMiddle .LayerOnboarding-step .LayerOnboarding-headerText', 'data-onboarding.add-geometry.title');
      assertText('.LayerOnboarding-pads--right .LayerOnboarding-padMiddle .LayerOnboarding-step .LayerOnboarding-description', 'data-onboarding.add-geometry.description');
      assertClasses('.LayerOnboarding-pads--right .LayerOnboarding-padMiddle .LayerOnboarding-footer', ['is-step4']);
      assertText('.LayerOnboarding-pads--right .LayerOnboarding-padMiddle .LayerOnboarding-footer .js-close span', 'data-onboarding.add-geometry.edit-layer');
      assertClasses('.LayerOnboarding-pads--right .LayerOnboarding-padBottom', ['has-timeSeries', 'has-timeSeries--animated', 'has-widgets']);

      // Widgets overlay
      assertClasses('.LayerOnboarding-widgetsOverlay', ['js-step', 'has-widgets']);
    });
  });
});
