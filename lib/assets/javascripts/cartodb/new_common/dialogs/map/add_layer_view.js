var BaseDialog = require('../../views/base_dialog/view');
var cdb = require('cartodb.js');
var CreateListing = require('../create/create_listing');
var FooterView = require('./add_layer/footer_view');

/**
 * Add layer dialog, typically used from editor
 */
module.exports = BaseDialog.extend({

  // TODO: CreateDialog necessary?
  // className: 'Dialog is-opening CreateDialog',

  initialize: function() {
    this.elder('initialize');
    if (!this.model) {
      throw new TypeError('model is required');
    }
    if (!this.options.user) {
      throw new TypeError('user is required');
    }

    this._template = cdb.templates.getTemplate('new_common/dialogs/map/add_layer_template');

    this._listingView = new CreateListing({
      createModel: this.model,
      user: this.options.user
    });
    this.addView(this._listingView);

    this._footerView = new FooterView({
      model: this.model
    });
    this.addView(this._footerView);
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render: function() {
    this.clearSubViews();
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this.$('.js-listing-content').append(this._listingView.render().el);
    this.$('.js-footer').append(this._footerView.render().el);
    return this;
  },

  // implements cdb.ui.common.Dialog.prototype.render
  render_content: function() {
    return this._template({
    });
  },

  ok: function() {
    console.log('tmp');
  }

});
