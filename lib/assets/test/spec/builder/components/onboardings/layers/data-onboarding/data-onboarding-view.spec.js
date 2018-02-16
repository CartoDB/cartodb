var Backbone = require('backbone');
var _ = require('underscore');
var View = require('builder/components/onboardings/layers/data-onboarding/data-onboarding-view');
var helper = require('../../onboarding-tests-helper');

describe('components/onboardings/layers/data-onboarding/data-onboarding-view', function () {
  function constructorFn (options) {
    var defaultOptions = {
      onboardingNotification: {},
      editorModel: new Backbone.Model({}),
      notificationKey: 'data-key',
      numberOfWidgets: 2,
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
      this.view = this.getView();
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

    it('should call `_setMiddlePad` with the proper values in each step', function () {
      this.view = this.getView();
      spyOn(this.view, '_setMiddlePad');

      // Step 0
      this.view.model.set('step', 0);
      this.view._onChangeStep();

      expect(this.view._setMiddlePad).toHaveBeenCalledWith('.js-editorPanel');
      this.view._setMiddlePad.calls.reset();

      // Step 1
      this.view.model.set('step', 1);
      this.view._onChangeStep();

      expect(this.view._setMiddlePad)
        .toHaveBeenCalledWith(
          '.js-editorPanelHeader',
          {top: 16, right: 24, left: 24}
        );
      this.view._setMiddlePad.calls.reset();

      // Step 2
      var optionsBarHeight = 45;
      var optionsBar = helper.addElement('js-optionsBar', 40, 50, 60, 45);
      this.view.model.set('step', 2);
      this.view._onChangeStep();

      expect(this.view._setMiddlePad)
        .toHaveBeenCalledWith(
          '.js-editorPanelContent',
          {top: 8, right: 24, left: 24, bottom: -optionsBarHeight}
        );
      this.view._setMiddlePad.calls.reset();
      document.body.removeChild(optionsBar);

      // Step 3
      this.view.model.set('step', 3);
      this.view._onChangeStep();

      expect(this.view._setMiddlePad).toHaveBeenCalledWith('.js-optionsBar', null, {top: -190});
      this.view._setMiddlePad.calls.reset();

      // Step 4
      this.view.model.set('step', 4);
      spyOn(this.view, '_getFeatureEditionPosition').and.returnValue('a value');
      this.view._onChangeStep();

      expect(this.view._setMiddlePad).toHaveBeenCalledWith(
        'a value',
        {top: 8, right: 8, bottom: 8, left: 8},
        {top: -270, left: -330}
      );
    });
  });

  describe('_getFeatureEditionPosition', function () {
    it('should retrieve `.js-mapTableView` position if no feature edition is present', function () {
      this.view = this.getView();
      var mapTableButton = helper.addElement('js-mapTableView', 40, 50, 60, 70);

      var position = this.view._getFeatureEditionPosition();

      expect(position.top).toBe(40);
      expect(position.left).toBe(50);
      expect(position.width).toBe(60);
      expect(position.height).toBe(70);

      document.body.removeChild(mapTableButton);
    });

    it('should retrieve the container of `.js-mapTableView` and `.js-newGeometryView`', function () {
      this.view = this.getView();
      var mapTableButton = helper.addElement('js-mapTableView', 40, 50, 60, 70);
      var featureEditionButton = helper.addElement('js-newGeometryView', 70, 20, 50, 100);

      var position = this.view._getFeatureEditionPosition();

      expect(position.top).toBe(40);
      expect(position.left).toBe(20);
      expect(position.width).toBe(90);
      expect(position.height).toBe(130);

      document.body.removeChild(mapTableButton);
      document.body.removeChild(featureEditionButton);
    });
  });
});
