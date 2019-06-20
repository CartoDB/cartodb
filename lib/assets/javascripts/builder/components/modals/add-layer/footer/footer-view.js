var CoreView = require('backbone/core-view');
var GuessingTogglerView = require('./guessing-toggler-view');
var PrivacyTogglerView = require('./privacy-toggler-view');
var template = require('./footer.tpl');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'privacyModel',
  'guessingModel',
  'createModel',
  'userModel',
  'configModel'
];

/**
 * Footer view for the add layer modal.
 */
module.exports = CoreView.extend({
  events: {
    'click .js-ok': '_finish'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        canFinish: this._createModel.canFinish(),
        listing: this._createModel.get('listing')
      })
    );

    this._initViews();

    return this;
  },

  _initViews: function () {
    var guessingTogglerView = new GuessingTogglerView({
      guessingModel: this._guessingModel,
      userModel: this._userModel,
      createModel: this._createModel,
      configModel: this._configModel
    });
    this.$('.js-footer-info').append(guessingTogglerView.render().el);
    this.addView(guessingTogglerView);

    var privacyTogglerView = new PrivacyTogglerView({
      privacyModel: this._privacyModel,
      userModel: this._userModel,
      createModel: this._createModel,
      configModel: this._configModel
    });
    this.$('.js-footerActions').prepend(privacyTogglerView.render().el);
    this.addView(privacyTogglerView);
  },

  _initBinds: function () {
    this.listenTo(this._createModel.getUploadModel(), 'change', this.render);
    this.listenTo(this._createModel.getSelectedDatasetsCollection(), 'all', this._update);
    this.listenTo(this._createModel, 'change', this._update);
  },

  _update: function () {
    var contentPane = this._createModel.get('contentPane');
    var listing = this._createModel.get('listing');
    if (contentPane === 'listing' && listing !== 'scratch') {
      this.render().show();
    } else {
      this.hide();
    }
  },

  _finish: function (e) {
    this.killEvent(e);
    if (this._createModel.canFinish()) {
      // Set proper guessing values before starting the upload
      // if dialog is in import section
      if (this._createModel.get('listing') === 'import') {
        var uploadModel = this._createModel.getUploadModel();
        uploadModel.setPrivacy(this._privacyModel.get('privacy'));
        uploadModel.setGuessing(this._guessingModel.get('guessing'));
      }
      this._userModel.updateTableCount();
      this._createModel.finish();
    }
  }

});
