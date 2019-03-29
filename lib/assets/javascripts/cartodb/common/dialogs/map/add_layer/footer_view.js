var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var GuessingTogglerView = require('../../create/footer/guessing_toggler_view');
var PrivacyTogglerView = require('../../create/footer/privacy_toggler_view');

/**
 * Footer view for the add layer modal.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-ok': '_finish'
  },

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
    this.guessingModel = new cdb.core.Model({ guessing: true });
    this.privacyModel = new cdb.core.Model({
      privacy: this.user.canCreatePrivateDatasets() ? 'PRIVATE' : 'PUBLIC'
    });
    this._template = cdb.templates.getTemplate('common/dialogs/map/add_layer/footer');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    var $el = $(
      this._template({
        canFinish: this.model.canFinish(),
        listing: this.model.get('listing')
      })
    );
    this.$el.html($el);

    this._initViews();

    return this;
  },

  _initViews: function() {
    var guessingTogglerView = new GuessingTogglerView({
      model: this.guessingModel,
      user: this.user,
      createModel: this.model
    });
    this.$('.js-footer-info').append(guessingTogglerView.render().el);
    this.addView(guessingTogglerView);

    this.privacyTogglerView = new PrivacyTogglerView({
      model: this.privacyModel,
      user: this.user,
      createModel: this.model
    });
    this.$('.js-footerActions').prepend(this.privacyTogglerView.render().el);
    this.addView(this.privacyTogglerView);
  },

  _initBinds: function() {
    this.model.upload.bind('change', this.render, this);
    this.model.selectedDatasets.bind('all', this._update, this);
    this.model.bind('change', this._update, this);
    this.add_related_model(this.model.upload);
    this.add_related_model(this.model.selectedDatasets);
  },

  _update: function() {
    var contentPane = this.model.get('contentPane');
    var listing = this.model.get('listing');
    if (contentPane === 'listing' && listing !== 'scratch') {
      this.render().show();
    } else {
      this.hide();
    }
  },

  _finish: function(e) {
    this.killEvent(e);
    if (this.model.canFinish()) {
      // Set proper guessing values before starting the upload
      // if dialog is in import section
      if (this.model.get('listing') === 'import') {
        this.model.upload.set('privacy', this.privacyModel.get('privacy'));
        this.model.upload.setGuessing(this.guessingModel.get('guessing'));
      }
      this.model.finish();
    }
  }

});
