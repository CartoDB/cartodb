const CoreView = require('backbone/core-view');
const ConfirmationModel = require('./confirmation-model');
const template = require('./confirmation-info.tpl');

/**
 *  Confirmation view
 *
 */

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userCreationId) {
      throw new Error('user creation id is needed to check its state');
    }

    this.model = new ConfirmationModel({
      id: opts.userCreationId
    });

    this._initBinds();

    this.model.pollCheck();
  },

  render: function () {
    this.$el.html(
      template({
        googleSignup: this.model.get('google_sign_in'),
        requiresValidationEmail: this.model.requiresValidationEmail(),
        userCreationId: this.model.get('id'),
        state: this.model.get('state'),
        customHosted: this.options.customHosted
      })
    );

    return this;
  },

  _initBinds: function () {
    this.model.bind('change:state', function () {
      this._setLogo();
      this.render();

      if (this.model.hasFinished() && (this.model.hasUsedGoogle() || !this.model.requiresValidationEmail())) {
        this._goToUserURL();
      }
    }, this);
  },

  // Instead of rendering logo each time and f**k the animation
  // we toggle the 'is-loading' class when process has finished
  _setLogo: function () {
    // Loading state
    this.$('.js-logo').toggleClass('is-loading', !this.model.hasFailed() && !this.model.hasFinished());

    // Remove unnecessary notification, if needed
    if (this.model.hasFailed()) {
      this.$('.js-successNotification').remove();
    } else if (this.model.hasFinished()) {
      this.$('.js-errorNotification').remove();
    }

    // Show notification if it is failed or finished
    if (this.model.hasFailed() || this.model.hasFinished()) {
      this.$('.js-notification').show();
    }
  },

  _goToUserURL: function () {
    if (this.options.userURL) {
      window.location.href = this.options.userURL;
    }
  }
});
