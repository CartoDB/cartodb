var cdb = require('cartodb-deep-insights.js');
var GuessingTogglerView = require('./guessing-toggler-view');
var PrivacyTogglerView = require('./privacy-toggler-view');
var template = require('./footer.tpl');

/**
 * Footer view for the add layer modal.
 */
module.exports = cdb.core.View.extend({
  events: {
    'click .js-ok': '_finish'
  },

  initialize: function (opts) {
    if (!opts.createModel) throw new TypeError('createModel is required');
    if (!opts.userModel) throw new TypeError('userModel is required');

    this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._guessingModel = new cdb.core.Model({
      guessing: true
    });
    this._privacyModel = new cdb.core.Model({
      privacy: this._userModel.canCreatePrivateDatasets() ? 'PRIVATE' : 'PUBLIC'
    });
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
      createModel: this._createModel
    });
    this.$('.js-footer-info').append(guessingTogglerView.render().el);
    this.addView(guessingTogglerView);

    var privacyTogglerView = new PrivacyTogglerView({
      privacyModel: this._privacyModel,
      userModel: this._userModel,
      createModel: this._createModel
    });
    this.$('.js-footerActions').prepend(privacyTogglerView.render().el);
    this.addView(privacyTogglerView);
  },

  _initBinds: function () {
    var uploadModel = this._createModel.getUploadModel();
    uploadModel.bind('change', this.render, this);
    var selectedDatasetsCollection = this._createModel.getSelectedDatasetsCollection();
    selectedDatasetsCollection.bind('all', this._update, this);
    this._createModel.bind('change', this._update, this);
    this.add_related_model(uploadModel);
    this.add_related_model(selectedDatasetsCollection);
    this.add_related_model(this._createModel);
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
      this._createModel.finish();
    }
  }

});
