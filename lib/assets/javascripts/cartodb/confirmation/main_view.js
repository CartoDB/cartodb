var $ = require('jquery');
var cdb = require('cartodb.js');
var ConfirmationModel = require('./confirmation_model');

/**
 *  Confirmation view
 *
 */

module.exports = Backbone.View.extend({

  el: document.body,

  initialize: function(opts) {
    if (!opts.userCreationId) {
      throw new Error('user creation id is needed to check its state');
    }
    this.template = cdb.templates.getTemplate('confirmation/confirmation_info');
    this.model = new ConfirmationModel({
      id: opts.userCreationId
    });
    this._initBinds();

    this.model.pollCheck();
  },

  render: function() {
    this.$('.js-info').html(
      this.template({
        googleSignup: this.model.get('google_sign_in'),
        userCreationId: this.model.get('id'),
        state: this.model.get('state'),
        customHosted: cdb.config.get('custom_com_hosted')
      })
    )
    return this;
  },

  _initBinds: function() {
    this.model.bind('change:state', function() {
      this._setLogo();
      this.render();
      if (this.model.hasFinished() && this.model.hasUsedGoogle()) {
        this._goToUserDashboard();
      }
    }, this);
  },

  // Instead of rendering logo each time and f**k the animation
  // we toggle the is-loading class when process has finished
  _setLogo: function() {
    this.$('.js-logo').toggleClass('is-loading', !this.model.hasFailed() && !this.model.hasFinished());
  },

  _goToUserDashboard: function() {
    if (this.options.userURL) {
      window.location.href = this.options.userURL;
    }
  }

});