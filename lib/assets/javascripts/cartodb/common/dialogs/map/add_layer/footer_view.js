var $ = require('jquery');
var cdb = require('cartodb.js');
var GuessingTogglerView = require('../../create/footer/guessing_toggler_view');

/**
 * Footer view for the add layer modal.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-ok': '_finish'
  },

  initialize: function() {
    this.elder('initialize');
    this.guessingModel = new cdb.core.Model({ guessing: true });
    this._template = cdb.templates.getTemplate('common/dialogs/map/add_layer/footer');
    this._initBinds();
  },

  // implements cdb.ui.common.Dialog.prototype.render
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
      createModel: this.model
    });
    this.$('.js-footer-info').append(guessingTogglerView.render().el);
    this.addView(guessingTogglerView);
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
      this.model.finish();
    }
  }

});
