var Backbone = require('backbone');
var _ = require('underscore');
var LayerOnboardingView = require('../../../../../../javascripts/cartodb3/components/onboardings/generic/generic-onboarding-view');
var helper = require('../onboarding-tests-helper');

describe('components/onboardings/generic/generic-onboarding-view', function () {
  beforeEach(function () {
    this.modifier = '--modifier';
    this.selector = 'GenericOnboarding';
    this.notificationKey = 'a notification key';
    this.editorModel = new Backbone.Model({});
    this.numberOfSteps = 3;
    this.template = function () {
      return '<div class="GenericOnboarding-toolbarOverlay"></div><div class="GenericOnboarding-pads GenericOnboarding-pads--left"> <div class="GenericOnboarding-padTop"></div><div class="GenericOnboarding-padMiddle"> <div class="GenericOnboarding-body is-step0 js-step"> <div class="GenericOnboarding-step is-step1"></div><div class="GenericOnboarding-footer is-step1"></div></div></div><div class="GenericOnboarding-padBottom"></div></div><div class="GenericOnboarding-contentWrapper is-step0 js-step"><div class="GenericOnboarding-contentBody"> <input class="js-forget" type="checkbox"></div></div>';
    };
    this.view = new LayerOnboardingView({
      onboardingNotification: jasmine.createSpyObj('onboardingNotification', ['setKey', 'save']),
      editorModel: this.editorModel,
      template: this.template,
      numberOfSteps: this.numberOfSteps,
      modifier: this.modifier,
      selector: this.selector,
      notificationKey: this.notificationKey
    });
  });

  describe('initialize', function () {
    it('should get proper initialization', function () {
      // Events
      expect(this.view.events['click .js-start']).toBe('_onClickNext');
      expect(this.view.events['click .js-next']).toBe('_onClickNext');
      expect(this.view.events['click .js-close']).toBe('_close');

      // Classname
      expect(this.view.className).toBe('is-step0 is-opening');

      // Model
      expect(this.view.model.get('step')).toBe(-1);
    });
  });

  describe('render', function () {
    it('should render the provided template', function () {
      this.view.render();

      expect(this.view.$('.GenericOnboarding-pads').length).toBe(1);
      expect(this.view.$('.GenericOnboarding-pads .GenericOnboarding-body').length).toBe(1);
      expect(this.view.$('.GenericOnboarding-contentBody').length).toBe(1);
      expect(this.view.$('.GenericOnboarding-contentBody').css('display')).toBe('block');
      expect(this.view.$el.hasClass(this.selector + this.modifier)).toBe(true);
    });
  });

  describe('_onChangeStep', function () {
    it('should be bound and should change classes to the changed step', function () {
      this.view.render();
      expect(this.view.$el.hasClass('is-step0')).toBe(true);
      expect(this.view.$('.js-step').hasClass('is-step0')).toBe(true);

      this.view.model.set('step', 1);

      expect(this.view.$el.hasClass('is-step0')).toBe(false);
      expect(this.view.$('.js-step').hasClass('is-step0')).toBe(false);
      expect(this.view.$el.hasClass('is-step1')).toBe(true);
      expect(this.view.$('.js-step').hasClass('is-step1')).toBe(true);
      expect(this.view.$('.GenericOnboarding-step.is-step1').css('display')).toBe('block');
      expect(this.view.$('.GenericOnboarding-footer.is-step1').css('display')).toBe('block');
      expect(this.view.$('.GenericOnboarding-contentBody').css('display')).toBe('none');
    });
  });

  describe('_close', function () {
    it('should be bound and should call _close when the event is triggered', function () {
      var closeTriggered = false;
      this.view.on('close', function () {
        closeTriggered = true;
      }, this);
      spyOn(this.view, '_checkForgetStatus');

      this.view.model.trigger('destroy');

      expect(closeTriggered).toBe(true);
      expect(this.view._checkForgetStatus).toHaveBeenCalled();
    });
  });

  describe('_changeEdition', function () {
    it('should be bound and should call _changeEdition when the event is triggered', function () {
      this.view.render();
      expect(this.view.$el.hasClass('is-editing')).toBe(false);

      this.view._editorModel.set('edition', true);

      expect(this.view.$el.hasClass('is-editing')).toBe(true);
    });
  });

  describe('_prev', function () {
    it('should decrease step if it is greater than 0', function () {
      this.view.model.set('step', 1);

      this.view._prev();

      expect(this.view.model.get('step')).toBe(0);
    });

    it('should decrease step if it is less or equal to 0', function () {
      this.view.model.set('step', 0);

      this.view._prev();

      expect(this.view.model.get('step')).toBe(0);
    });
  });

  describe('_next', function () {
    it('should increase step if it is less than number of steps', function () {
      this.view.model.set('step', this.numberOfSteps - 1);

      this.view._next();

      expect(this.view.model.get('step')).toBe(this.numberOfSteps);
    });

    it('should decrease step if it is less or equal to 0', function () {
      this.view.model.set('step', this.numberOfSteps);

      this.view._next();

      expect(this.view.model.get('step')).toBe(this.numberOfSteps);
    });

    it('should be triggered by _onClickNext', function () {
      spyOn(this.view, '_next');

      this.view._onClickNext();

      expect(this.view._next).toHaveBeenCalled();
    });
  });

  describe('_onKeyDown', function () {
    it('should call _prev if LEFT key is pressed', function () {
      var stopPropagationCalled = false;
      var event = {
        stopPropagation: function () { stopPropagationCalled = true; },
        which: 37 // LEFT
      };
      spyOn(this.view, '_prev');

      this.view._onKeyDown(event);

      expect(stopPropagationCalled).toBe(true);
      expect(this.view._prev).toHaveBeenCalled();
    });

    it('should call _next if RIGHT key is pressed', function () {
      var stopPropagationCalled = false;
      var event = {
        stopPropagation: function () { stopPropagationCalled = true; },
        which: 39 // RIGHT
      };
      spyOn(this.view, '_next');

      this.view._onKeyDown(event);

      expect(stopPropagationCalled).toBe(true);
      expect(this.view._next).toHaveBeenCalled();
    });
  });

  describe('forget', function () {
    it('_checkForgetStatus should call forget if check is checked', function () {
      this.view.render();
      this.view.$('.js-forget').attr('checked', true);

      this.view._checkForgetStatus();

      expect(this.view._onboardingNotification.setKey).toHaveBeenCalledWith(this.notificationKey, true);
      expect(this.view._onboardingNotification.save).toHaveBeenCalled();
    });

    it('_checkForgetStatus should not call anywhere if check is not checked', function () {
      this.view.render();

      this.view._checkForgetStatus();

      expect(this.view._onboardingNotification.setKey).not.toHaveBeenCalled();
      expect(this.view._onboardingNotification.save).not.toHaveBeenCalled();
    });
  });

  describe('_setMiddlePad', function () {
    it('should highlight the element with the given selector', function () {
      var className = _.uniqueId('phonyElement');
      var div = helper.addElement(className, 707, 303, 70, 40);
      this.view.render();
      var onboardingContainer = helper.createOnboardingContainer(this.view.$el[0]);

      this.view._setMiddlePad('.' + className, {top: 1, right: 2, bottom: 3, left: 4});

      expect(helper.assertHighlightPosition(this.view, 'GenericOnboarding', 706, 299, 76, 44)).toBe(true);

      // Cleaning
      document.body.removeChild(div);
      document.body.removeChild(onboardingContainer);
    });

    it('should highlight the element with the given position', function () {
      var position = {
        top: 707,
        left: 303,
        width: 70,
        height: 40
      };
      this.view.render();
      var onboardingContainer = helper.createOnboardingContainer(this.view.$el[0]);

      this.view._setMiddlePad(position, {top: 1, right: 2, bottom: 3, left: 4});

      expect(helper.assertHighlightPosition(this.view, 'GenericOnboarding', 706, 299, 76, 44)).toBe(true);

      // Cleaning
      document.body.removeChild(onboardingContainer);
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });

  describe('._currentStep', function () {
    it('should get the current step', function () {
      expect(this.view._currentStep()).toBe(-1);

      this.view.model.set('step', 1);

      expect(this.view.model.get('step')).toBe(1);
      expect(this.view._currentStep()).toBe(this.view.model.get('step'));
    });
  });
});
