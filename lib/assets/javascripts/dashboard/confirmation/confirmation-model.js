const Backbone = require('backbone');

const POLL_TIMER = 2000; // Interval time between poll checkings
const TIMER_MULTIPLY = 2.5; // Multiply interval for this number
const MAX_TRIES = 30; // Max tries until interval change
const STATES = {
  success: 'success',
  failure: 'failure'
};

/**
 *  User creation model
 *
 */

module.exports = Backbone.Model.extend({

  defaults: {
    email: '',
    google_sign_in: false,
    requires_validation_email: false,
    state: '',
    username: ''
  },

  url: function (method) {
    return `/api/v1/user_creations/${this.id}`;
  },

  initialize: function () {
    this._initBinds();
  },

  _initBinds: function () {
    this.bind('change:state', this._checkState, this);
  },

  _checkState: function () {
    if (this.hasFinished() || this.hasFailed()) {
      this.destroyCheck();
    }
  },

  pollCheck: function () {
    if (this.pollTimer) return;
    let tries = 0;

    const request = () => {
      this.destroyCheck();
      this.fetch();

      tries += 1;

      // Multiply polling timer by a number when a max
      // of tries have been reached
      const multiply = tries > MAX_TRIES ? TIMER_MULTIPLY : 1;

      this.pollTimer = setInterval(request, POLL_TIMER * multiply);
    };

    this.pollTimer = setInterval(request, POLL_TIMER);

    // Start doing a fetch
    request();
  },

  destroyCheck: function () {
    clearInterval(this.pollTimer);
    delete this.pollTimer;
  },

  hasUsedGoogle: function () {
    return this.get('google_sign_in');
  },

  requiresValidationEmail: function () {
    return this.get('requires_validation_email');
  },

  hasFinished: function () {
    return this.get('state') === STATES.success;
  },

  hasFailed: function () {
    return this.get('state') === STATES.failure;
  }
});
