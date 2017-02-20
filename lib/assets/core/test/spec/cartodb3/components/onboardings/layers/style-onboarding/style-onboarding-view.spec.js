var Backbone = require('backbone');
var _ = require('underscore');
var View = require('../../../../../../../javascripts/cartodb3/components/onboardings/layers/style-onboarding/style-onboarding-view');

describe('components/onboardings/layers/style-onboarding/style-onboarding-view', function () {
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
        notificationKey: 'style-key'
      };

      var constructor = testConstructor(options);
      expect(constructor).toThrowError('geom is required');

      constructor = testConstructor(options = _.extend(options, {
        geom: 'point'
      }));
      expect(constructor).toThrowError('type is required');

      testConstructor(options = _.extend(options, {
        type: 'simple'
      }))();

      // Number of steps
      // Points
      expect(this.view._numberOfSteps).toBe(3);

      // Polygon
      testConstructor(options = _.extend(options, { geom: 'polygon' }))();
      expect(this.view._numberOfSteps).toBe(2);

      // Type of aggregation
      testConstructor(options = _.extend(options, { geom: 'point', type: 'simple' }))();
      expect(this.view._modifier).toEqual('--stylePointsSimpleAggregation');

      testConstructor(options = _.extend(options, { type: 'heatmap' }))();
      expect(this.view._modifier).toEqual('--stylePointsSimpleAggregation');

      testConstructor(options = _.extend(options, { type: 'animation' }))();
      expect(this.view._modifier).toEqual('--stylePointsSimpleAggregation');

      testConstructor(options = _.extend(options, { type: 'squares' }))();
      expect(this.view._modifier).toEqual('--stylePointsDoubleAggregation');

      testConstructor(options = _.extend(options, { type: 'hexabins' }))();
      expect(this.view._modifier).toEqual('--stylePointsDoubleAggregation');

      testConstructor(options = _.extend(options, { type: 'regions' }))();
      expect(this.view._modifier).toEqual('--stylePointsDoubleAggregation');
    });
  });

  describe('templates', function () {
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

    it('points template with simple aggregation', function () {
      this.view = new View({
        onboardingNotification: {},
        editorModel: new Backbone.Model({}),
        notificationKey: 'style-key',
        geom: 'point',
        type: 'simple'
      });
      var assertText = assertTextFn.bind(this, this.view);
      var assertClasses = assertClassesFn.bind(this, this.view);
      this.view.render();

      // Pads on the left
      var leftPads = '.LayerOnboarding-pads--left';
      assertClasses(leftPads + ' .LayerOnboarding-body', ['is-step0', 'js-step']);
      assertText(leftPads + ' .LayerOnboarding-step.is-step1 .LayerOnboarding-headerText', 'style-onboarding.aggregation.title');
      assertText(leftPads + ' .LayerOnboarding-step.is-step1 .LayerOnboarding-description', 'style-onboarding.aggregation.description');
      assertText(leftPads + ' .LayerOnboarding-step.is-step2 .LayerOnboarding-headerText', 'style-onboarding.style.title');
      assertText(leftPads + ' .LayerOnboarding-step.is-step2 .LayerOnboarding-description', 'style-onboarding.style.description');
      assertText(leftPads + ' .LayerOnboarding-step.is-step3 .LayerOnboarding-headerText', 'style-onboarding.cartocss.title');
      assertText(leftPads + ' .LayerOnboarding-step.is-step3 .LayerOnboarding-description', 'style-onboarding.cartocss.description');
      assertText(leftPads + ' .LayerOnboarding-footer.is-step1.is-step2 .js-close span', 'style-onboarding.exit');
      assertText(leftPads + ' .LayerOnboarding-footer.is-step1.is-step2 .js-next span', 'style-onboarding.next');
      assertText(leftPads + ' .LayerOnboarding-footer.is-step3 .js-close span', 'style-onboarding.style-layer');

      // Content wrapper
      var content = '.LayerOnboarding-contentWrapper';
      assertClasses(content, ['is-step0', 'js-step']);
      assertClasses(content + ' .LayerOnboarding-contentBody', ['is-step0', 'js-step']);
      assertClasses(content + ' .LayerOnboarding-header', ['is-step0']);
      assertText(content + ' .LayerOnboarding-headerTitle', 'style-onboarding.title');
      assertText(content + ' .LayerOnboarding-description', 'style-onboarding.description');
      assertClasses(content + ' .LayerOnboarding-footer', ['is-step0']);
      assertText(content + ' .LayerOnboarding-footer .js-start', 'style-onboarding.take-tour');
      assertText(content + ' .LayerOnboarding-footer .js-close', 'style-onboarding.style-layer');
      assertText(content + ' .LayerOnboarding-footer .u-iBlock.is-step1 label', 'style-onboarding.never-show-message');
      expect(true).toBe(true); // In case no error was thrown in assert functions, we need to pass at least one expectation to get the test in green.
    });

    it('polygons template', function () {
      this.view = new View({
        onboardingNotification: {},
        editorModel: new Backbone.Model({}),
        notificationKey: 'style-key',
        geom: 'polygon',
        type: 'simple'
      });
      var assertText = assertTextFn.bind(this, this.view);
      var assertClasses = assertClassesFn.bind(this, this.view);
      this.view.render();

      // Pads on the left
      var leftPads = '.LayerOnboarding-pads--left';
      assertClasses(leftPads + ' .LayerOnboarding-body', ['is-step0', 'js-step']);
      assertText(leftPads + ' .LayerOnboarding-step.is-step1 .LayerOnboarding-headerText', 'style-onboarding.style.title');
      assertText(leftPads + ' .LayerOnboarding-step.is-step1 .LayerOnboarding-description', 'style-onboarding.style.short-description');
      assertText(leftPads + ' .LayerOnboarding-step.is-step2 .LayerOnboarding-headerText', 'style-onboarding.cartocss.title');
      assertText(leftPads + ' .LayerOnboarding-step.is-step2 .LayerOnboarding-description', 'style-onboarding.cartocss.description');
      assertText(leftPads + ' .LayerOnboarding-footer.is-step1.is-step1 .js-close span', 'style-onboarding.exit');
      assertText(leftPads + ' .LayerOnboarding-footer.is-step1.is-step1 .js-next span', 'style-onboarding.next');
      assertText(leftPads + ' .LayerOnboarding-footer.is-step2 .js-close span', 'style-onboarding.style-layer');

      // Content wrapper
      var content = '.LayerOnboarding-contentWrapper';
      assertClasses(content, ['is-step0', 'js-step']);
      assertClasses(content + ' .LayerOnboarding-contentBody', ['is-step0', 'js-step']);
      assertClasses(content + ' .LayerOnboarding-header', ['is-step0']);
      assertText(content + ' .LayerOnboarding-headerTitle', 'style-onboarding.title');
      assertText(content + ' .LayerOnboarding-description', 'style-onboarding.description');
      assertClasses(content + ' .LayerOnboarding-footer', ['is-step0']);
      assertText(content + ' .LayerOnboarding-footer .js-start', 'style-onboarding.take-tour');
      assertText(content + ' .LayerOnboarding-footer .js-close', 'style-onboarding.style-layer');
      assertText(content + ' .LayerOnboarding-footer .u-iBlock.is-step1 label', 'style-onboarding.never-show-message');
      expect(true).toBe(true); // In case no error was thrown in assert functions, we need to pass at least one expectation to get the test in green.
    });
  });
});
