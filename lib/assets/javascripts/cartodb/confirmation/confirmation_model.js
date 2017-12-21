var cdb = require('cartodb.js-v3');
var cdbAdmin = require('cdb.admin');
var pollTimer = 2000; // Interval time between poll checkings
var timerMultiply = 2.5;  // Multiply interval for this number
var maxTries = 30; // Max tries until interval change

/**
 *  User creation model
 *
 */

module.exports = cdb.core.Model.extend({

  defaults: {
    email: '',
    google_sign_in: false,
    requires_validation_email: false,
    state: '',
    username: ''
  },

  url: function(method) {
    var base = '/api/v1/user_creations';
    return base + '/' + this.id;
  },

  initialize: function() {
    this._initBinds();
  },

  _initBinds: function() {
    this.bind('change:state', this._checkState, this);
  },

  _checkState: function() {
    var state = this.get('state');
    if (this.hasFinished() || this.hasFailed()) {
      this.destroyCheck();
    }
  },

  pollCheck: function() {
    if (this.pollTimer) return;
    var self = this;
    var tries = 0;
    this.pollTimer = setInterval(request, pollTimer);

    function request() {
      self.destroyCheck();
      self.fetch();
      ++tries;
      // Multiply polling timer by a number when a max
      // of tries have been reached
      var multiply = tries > maxTries ? timerMultiply : 1 ;
      self.pollTimer = setInterval(request, pollTimer * multiply);
    }

    // Start doing a fetch
    request();
  },

  destroyCheck: function() {
    clearInterval(this.pollTimer);
    delete this.pollTimer;
  },

  hasUsedGoogle: function() {
    return this.get('google_sign_in')
  },

  requiresValidationEmail: function() {
    return this.get('requires_validation_email');
  },

  hasFinished: function() {
    return this.get('state') === "success"
  },

  hasFailed: function() {
    return this.get('state') === "failure"
  }

});
