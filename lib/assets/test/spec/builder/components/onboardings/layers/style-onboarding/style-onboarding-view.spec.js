var Backbone = require('backbone');
var _ = require('underscore');
var View = require('builder/components/onboardings/layers/style-onboarding/style-onboarding-view');
var helper = require('../../onboarding-tests-helper');

describe('components/onboardings/layers/style-onboarding/style-onboarding-view', function () {
  function constructorFn (options) {
    var defaultOptions = {
      onboardingNotification: {},
      editorModel: new Backbone.Model({}),
      notificationKey: 'style-key',
      geom: 'point',
      selector: 'LayerOnboarding'
    };
    return new View(_.extend(defaultOptions, options || {}));
  }

  beforeEach(function () {
    this.getView = constructorFn.bind(this);
  });

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
      expect(constructor).toThrowError('selector is required');

      testConstructor(options = _.extend(options, {
        selector: 'LayerOnboarding'
      }))();

      // Number of steps
      // Points
      expect(this.view._numberOfSteps).toBe(3);

      // Polygon
      testConstructor(options = _.extend(options, { geom: 'polygon' }))();
      expect(this.view._numberOfSteps).toBe(2);
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

    it('points template', function () {
      this.view = this.getView();
      var assertText = assertTextFn.bind(this, this.view);
      var assertClasses = assertClassesFn.bind(this, this.view);
      var editorPanel = helper.addElement('js-editorPanel', 40, 50, 60, 70);
      this.view.render();
      var onboardingContainer = helper.createOnboardingContainer(this.view.$el[0]);

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
      expect(true).toBe(true); // In case no error was thrown in assert functions, we need to pass at least one expectation to get the test in green.

      document.body.removeChild(onboardingContainer);
      document.body.removeChild(editorPanel);
    });

    it('polygons template', function () {
      this.view = this.getView({geom: 'polygon'});
      var assertText = assertTextFn.bind(this, this.view);
      var assertClasses = assertClassesFn.bind(this, this.view);
      var editorPanel = helper.addElement('js-editorPanel', 40, 50, 60, 70);
      this.view.render();
      var onboardingContainer = helper.createOnboardingContainer(this.view.$el[0]);

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
      expect(true).toBe(true); // In case no error was thrown in assert functions, we need to pass at least one expectation to get the test in green.

      document.body.removeChild(onboardingContainer);
      document.body.removeChild(editorPanel);
    });
  });

  describe('_onChangeStep', function () {
    it('should call prototype function before anything else', function () {
      this.view = this.getView();
      var calls = [];
      spyOn(this.view, '_setMiddlePad').and.callFake(function () {
        calls.push('_setMiddlePad');
      });
      spyOn(Object.getPrototypeOf(Object.getPrototypeOf(this.view)), '_onChangeStep').and.callFake(function () {
        calls.push('_prototype');
      });
      this.view.model.set('step', 0);
      calls.length = 0;

      this.view._onChangeStep();

      expect(calls.length).toBeGreaterThan(1);
      expect(calls[0]).toEqual('_prototype');
      expect(calls[1]).toEqual('_setMiddlePad');
    });

    it('should call proper functions in each step', function () {
      this.view = this.getView();
      spyOn(this.view, '_setMiddlePad');
      spyOn(this.view, '_setStepOne');
      spyOn(this.view, '_setStepTwo');
      spyOn(this.view, '_highlightOptionsBar');

      // Step 0
      this.view.model.set('step', 0);
      this.view._onChangeStep();

      expect(this.view._setMiddlePad).toHaveBeenCalledWith('.js-editorPanel');

      // Step 1
      this.view.model.set('step', 1);
      this.view._onChangeStep();

      expect(this.view._setStepOne).toHaveBeenCalled();

      // Step 2
      this.view.model.set('step', 2);
      this.view._onChangeStep();

      expect(this.view._setStepTwo).toHaveBeenCalled();

      // Step 3
      this.view.model.set('step', 3);
      this.view._onChangeStep();

      expect(this.view._highlightOptionsBar).toHaveBeenCalled();
    });
  });

  describe('_setStepOne', function () {
    it('should highlight `.js-styleNoGeom` if present', function () {
      var noGeomEl = helper.addElement('js-styleNoGeom', 40, 50, 60, 70);
      this.view = this.getView();
      spyOn(this.view, '_setMiddlePad');

      this.view._setStepOne();

      expect(this.view._setMiddlePad).toHaveBeenCalledWith('.js-styleNoGeom', {top: 8, right: 24, left: 24, bottom: 8});
      document.body.removeChild(noGeomEl);
    });

    it('should highlight aggregation panels if the onboarding has three steps', function () {
      this.view = this.getView();
      this.view._numberOfSteps = 3;
      spyOn(this.view, '_getAggregationPositionAndPadding').and.returnValue({
        position: 'a position',
        padding: 'a padding'
      });
      spyOn(this.view, '_setMiddlePad');

      this.view._setStepOne();

      expect(this.view._setMiddlePad).toHaveBeenCalledWith('a position', 'a padding');
    });

    it('should highlight style panel if the onboarding has two steps', function () {
      this.view = this.getView();
      this.view._numberOfSteps = 2;
      spyOn(this.view, '_highlightStyleProperties');

      this.view._setStepOne();

      expect(this.view._highlightStyleProperties).toHaveBeenCalled();
    });
  });

  describe('_setStepTwo', function () {
    it('should highlight options bar if the onboarding has two steps', function () {
      this.view = this.getView();
      this.view._numberOfSteps = 2;
      spyOn(this.view, '_highlightOptionsBar');

      this.view._setStepTwo();

      expect(this.view._highlightOptionsBar).toHaveBeenCalled();
    });

    it('should highlight style panel if the onboarding has three steps', function () {
      this.view = this.getView();
      this.view._numberOfSteps = 3;
      spyOn(this.view, '_highlightStyleProperties');

      this.view._setStepTwo();

      expect(this.view._highlightStyleProperties).toHaveBeenCalled();
    });
  });

  describe('_highlightStyleProperties', function () {
    it('should call `_setMiddlePad` with proper values', function () {
      this.view = this.getView();
      spyOn(this.view, '_setMiddlePad');

      this.view._highlightStyleProperties();

      expect(this.view._setMiddlePad)
        .toHaveBeenCalledWith('.js-styleProperties', {top: 8, right: 24, left: 24, bottom: 8});
    });
  });

  describe('_highlightOptionsBar', function () {
    it('should call `_setMiddlePad` with proper values', function () {
      this.view = this.getView();
      spyOn(this.view, '_setMiddlePad');

      this.view._highlightOptionsBar();

      expect(this.view._setMiddlePad)
        .toHaveBeenCalledWith('.js-optionsBar', null, {top: -190});
    });
  });

  describe('_getAggregationPositionAndPadding', function () {
    it('should return `js-aggregationTypes` position if no aggregation options are present', function () {
      this.view = this.getView();
      var aggTypesPanel = helper.addElement('js-aggregationTypes', 40, 50, 60, 70);

      var result = this.view._getAggregationPositionAndPadding();

      expect(_.isEqual(result.position, {top: 40, left: 50, width: 60, height: 70})).toBe(true);
      expect(_.isEqual(result.padding, {top: 8, right: 24, bottom: 0, left: 24})).toBe(true);
      document.body.removeChild(aggTypesPanel);
    });

    it('should return `js-aggregationTypes` plus `aggregationOptions` height and additional padding', function () {
      this.view = this.getView();
      var aggTypesPanel = helper.addElement('js-aggregationTypes', 40, 50, 60, 70);
      var aggOptionsPanel = helper.addElement('js-aggregationOptions', 40, 50, 60, 70);

      var result = this.view._getAggregationPositionAndPadding();

      expect(_.isEqual(result.position, {top: 40, left: 50, width: 60, height: 140})).toBe(true);
      expect(_.isEqual(result.padding, {top: 8, right: 24, bottom: 8, left: 24})).toBe(true);
      document.body.removeChild(aggTypesPanel);
      document.body.removeChild(aggOptionsPanel);
    });
  });
});
