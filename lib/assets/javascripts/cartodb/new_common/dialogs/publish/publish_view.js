var cdb = require('cartodb.js');
var _ = require('underscore');
var $ = require('jquery');
var Backbone = require('backbone');
var BaseDialog = require('../../views/base_dialog/view');
var OptionView = require('./publish_option_view');

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
    this._initOptions();
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    this.clearSubViews();

    var $el = $(
      cdb.templates.getTemplate('new_common/dialogs/publish/publish')({
      })
    );

    this._options.each(function(model) {
      var view = new OptionView({
        model: model
      });
      this.addView(view);
      $el.find('.js-publish-options').append(view.render().el);
    }, this);

    return $el;
  },

  _initOptions: function() {
    // Public URL option
    this._options = new Backbone.Collection();
    var publicUrlOption = new cdb.core.Model({
      template: 'new_common/dialogs/publish/options/public_url',
      isShorteningURL: true
    });
    this._options.add(publicUrlOption);

    // Embed option
    var embedOption = new cdb.core.Model({
      template: 'new_common/dialogs/publish/options/embed',
      copyableValue: this.model.embedURL()
    });
    this._options.add(embedOption);

    // CartoDB.js option
    this._options.add(
      new cdb.core.Model({
        template: 'new_common/dialogs/publish/options/cdb',
        copyableValue: this.model.vizjsonURL()
      })
    );

    // The vis' privacy setting has some side-effects:
    if (this.model.get('privacy') === 'PRIVATE') {
      publicUrlOption.set('disabledBecausePrivate', true);
      embedOption.set('disabledBecausePrivate', true);
    } else {
      // Shorten the public URL if possible, update model when ready
      var publicURL = this.model.publicURL();
      var urlShortener = new cdb.editor.UrlShortener();
      urlShortener.fetch(publicURL, {
        success: function(shortenedUrl) {
          publicUrlOption.set({
            isShorteningURL: false,
            copyableValue: shortenedUrl
          });
        },
        error: function(originalUrl) {
          publicUrlOption.set({
            isShorteningURL: false,
            copyableValue: originalUrl
          });
        }
      });
    }
  },

  _openPrivacyDialog: function(e) {
    this.killEvent(e);
    cdb.god.trigger('openPrivacyDialog', this.model);
    this.close();
  }

});
