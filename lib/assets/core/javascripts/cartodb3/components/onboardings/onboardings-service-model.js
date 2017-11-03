var _ = require('underscore');
var Backbone = require('backbone');
var OnboardingView = require('./onboarding-view');
var OnboardingViewModel = require('./onboarding-view-model');

var DESTROYED_ONBOARDING_EVENT = 'destroyedOnboarding';

/**
 * Top-level API to handle onboardings.
 * Is intended to be instantiated and registered in some top-level namespace to be accessibel within the lifecycle of
 * an client-side application.
 *
 * Example:
 * // In some entry-point:
 * cdb.onboardings = new OnboardingsServiceModel();
 *
 * // Later, in any view, calling create will create a new onboarding viewModel
 * var onboardingView = cdb.onboardings.create(fn)
 *
 * You will probably see the name of "Onboarding" here and there, it's the old nomenclature for the concept of Onboarding.
 */
module.exports = Backbone.Model.extend({

  /**
   * Creates a new onboarding view
   *
   * @param {Function} createContentView
   * @return {View} the new onboarding view
   */
  create: function (createContentView, contentClasses) {
    if (!_.isFunction(createContentView)) throw new Error('createContentView is required');

    if (!this._onboardingView) {
      this.trigger('willCreateOnboarding');
      this._onboardingView = this._newOnboardingView();
      this.trigger('didCreateOnboarding', this._onboardingView);
      document.body.appendChild(this._onboardingView.el);
    }

    this._onboardingView.model.set('createContentView', createContentView);
    this._onboardingView.model.set('contentClasses', contentClasses);
    this._onboardingView.render();

    return this._onboardingView;
  },

  /**
   * Convenience method to add a listener when current onboarding is destroyed
   *
   * This is the same as doing
   * onboardings.create(function (model) {
   *   model.once('destroy', callback, context); // <-- same as onboardings.onDestroyOnce(callback, context);
   *   return new MyView({ … });
   * });
   *
   * @param {Function} callback
   * @param {Object} [context = undefined]
   */
  onDestroyOnce: function (callback, context) {
    this.once(DESTROYED_ONBOARDING_EVENT, callback, context);
  },

  destroy: function () {
    if (this._onboardingView) {
      this._onboardingView.model.destroy();
    }
  },

  _newOnboardingView: function () {
    var viewModel = new OnboardingViewModel();
    this._handleBodyClass(viewModel);
    this._destroyOnEsc(viewModel);

    this.listenToOnce(viewModel, 'destroy', function () {
      this._onboardingView = null;
      this.trigger.apply(this, [DESTROYED_ONBOARDING_EVENT].concat(Array.prototype.slice.call(arguments)));
      this.stopListening(viewModel);
    });

    var onboardingView = new OnboardingView({
      model: viewModel
    });

    onboardingView.bind('customEvent', function (eventName) {
      this.trigger(eventName);
    }, this);

    return onboardingView;
  },

  _destroyOnEsc: function (viewModel) {
    var destroyOnEsc = function (ev) {
      if (ev.keyCode === 27) {
        viewModel.destroy();
      }
    };
    document.addEventListener('keydown', destroyOnEsc);
    this.listenToOnce(viewModel, 'destroy', function () {
      document.removeEventListener('keydown', destroyOnEsc);
    });
  },

  /**
   * TL;DR this method manages document.body class state, to enable scroll inside of an open onboarding.
   *
   * Some onboarding content have too much content that can be displayed in the viewport the scroll needs to be enabled.
   * Since the onboarding is implemented as a fixed positioned element the body needs to be fixated too, for the scroll to
   * be enabled inside the onboarding instead.
   */
  _handleBodyClass: function (viewModel) {
    var bodyClass = 'is-inDialog';
    document.body.classList.add(bodyClass);

    this.listenTo(viewModel, 'change:show', function (m, show) {
      document.body.classList[show ? 'add' : 'remove'](bodyClass);
    });

    this.listenToOnce(viewModel, 'destroy', function () {
      document.body.classList.remove(bodyClass);
    });
  }

});
