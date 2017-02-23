var Backbone = require('backbone');
var LayerOnboardingView = require('../../../../../..//javascripts/cartodb3/components/onboardings/layers/layer-onboarding-view');
var layerOnboardingKey = require('../../../../../..//javascripts/cartodb3/components/onboardings/layers/layer-onboarding-key');

describe('components/onboardings/layers/layer-onboarding-view', function () {
  beforeEach(function () {
    this.modifier = '--modifier';
    this.editorModel = new Backbone.Model({});
    this.numberOfSteps = 3;
    this.template = function () {
      return '<h1 class="js-step is-step0">This is a template</h1><input class="js-forget" type="checkbox">';
    };
    this.view = new LayerOnboardingView({
      onboardingNotification: jasmine.createSpyObj('onboardingNotification', ['setKey', 'save']),
      editorModel: this.editorModel,
      template: this.template,
      numberOfSteps: this.numberOfSteps,
      modifier: this.modifier
    });
  });

  describe('initialize', function () {
    it('should get proper initialization', function () {
      // Events
      expect(this.view.events['click .js-start']).toBe('_onClickNext');
      expect(this.view.events['click .js-next']).toBe('_onClickNext');
      expect(this.view.events['click .js-close']).toBe('_close');

      // Classname
      expect(this.view.className).toBe('LayerOnboarding is-step0 is-opening');

      // Model
      expect(this.view.model.get('step')).toBe(0);
    });
  });

  describe('render', function () {
    it('should render the provided template', function () {
      this.view.render();

      expect(this.view.$el.html()).toEqual(this.template());
      expect(this.view.$el.hasClass('LayerOnboarding' + this.modifier)).toBe(true);
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

      expect(this.view._onboardingNotification.setKey).toHaveBeenCalledWith(layerOnboardingKey, true);
      expect(this.view._onboardingNotification.save).toHaveBeenCalled();
    });

    it('_checkForgetStatus should not call anywhere if check is not checked', function () {
      this.view.render();

      this.view._checkForgetStatus();

      expect(this.view._onboardingNotification.setKey).not.toHaveBeenCalled();
      expect(this.view._onboardingNotification.save).not.toHaveBeenCalled();
    });
  });

  it('should not have any leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
