var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
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

    // TODO: remove mixpanel
    cdb.god.trigger('mixpanel', 'Click Publish Visualization');
    cdb.god.trigger('mixpanel_people', {'publish_visualization_last_clicked': new Date()});

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
      template: 'common/dialogs/publish/options/public_url',
      isShorteningURL: true
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
      // Shorten the public URL if possible, update model when ready
      var self = this;
      var publicURL = this.model.publicURL();
      var urlShortener = new cdb.editor.UrlShortener();
      urlShortener.fetch(publicURL, {
        success: function(shortenedUrl) {
          self._publicUrlOption.set({
            isShorteningURL: false,
            url: shortenedUrl
          });
        },
        error: function(originalUrl) {
          self._publicUrlOption.set({
            isShorteningURL: false,
            url: originalUrl
          });
        }
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
