var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var $ = require('jquery-cdb-v3');
var Backbone = require('backbone-cdb-v3');
var BaseDialog = require('../../views/base_dialog/view');
var OptionView = require('./publish_option_view');
var ViewModel = require('./options/view_model');

/**
 * Delete items dialog
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-change-privacy': '_openPrivacyDialog'
    });
  },

  initialize: function() {
    this.elder('initialize');
    if (!this.model) throw new Error('model (vis) is required');
    if (!this.options.user) throw new Error('user is required');
    this._initOptions();
    this._initBinds();
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    this.clearSubViews();

    var $el = $(
      cdb.templates.getTemplate('common/dialogs/publish/publish')({
      })
    );

    this._options.each(function(model) {
      var view = new OptionView({
        model: model
      });
      this.addView(view);
      $el.find('.js-publish-options').append(view.render().el);
    }, this);

    // Event tracking "Published visualization"
    cdb.god.trigger('metrics', 'published_visualization', {
      email: window.user_data.email
    });

    return $el;
  },

  _initOptions: function() {
    // Public URL option
    this._options = new Backbone.Collection();
    this._publicUrlOption = new ViewModel({
      template: 'common/dialogs/publish/options/public_url'
    });
    this._options.add(this._publicUrlOption);

    // Embed option
    this._embedOption = new ViewModel({
      template: 'common/dialogs/publish/options/embed',
      embedURL: this.model.embedURL()
    });
    this._options.add(this._embedOption);

    // CartoDB.js option
    this._options.add(
      new ViewModel({
        template: 'common/dialogs/publish/options/cdb',
        vizjsonURL: this.model.vizjsonURL()
      })
    );

    this._updateOptionsWithNewPrivacy();
  },

  _updateOptionsWithNewPrivacy: function() {
    var isPrivate = this.model.get('privacy') === 'PRIVATE';

    this._publicUrlOption.set('isPrivacyPrivate', isPrivate);
    this._embedOption.set('isPrivacyPrivate', isPrivate);

    if (!isPrivate) {
      var publicURL = this.model.publicURL();
      this._publicUrlOption.set({
        url: publicURL
      });
    }
  },

  _initBinds: function() {
    this.model.bind('change:privacy', this._updateOptionsWithNewPrivacy, this);
  },

  _openPrivacyDialog: function(e) {
    this.killEvent(e);

    var privacyModal = new cdb.editor.ChangePrivacyView({
      vis: this.model, //vis
      user: this.options.user,
      clean_on_hide: true,
      enter_to_confirm: true
    });

    // Do not remove this dialog but keep it until returning
    var originalCleanOnHideValue = this.options.clean_on_hide;
    this.options.clean_on_hide = false;
    this.close();
    privacyModal.appendToBody();

    // Return to this view when done
    var self = this;
    var onClose = function() {
      privacyModal.unbind('hide', onClose);
      self.options.clean_on_hide = originalCleanOnHideValue;
      self.show();
      privacyModal.close();
    };
    privacyModal.bind('hide', onClose);
  }

});
