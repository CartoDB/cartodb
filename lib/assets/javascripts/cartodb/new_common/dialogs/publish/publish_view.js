var cdb = require('cartodb.js');
var $ = require('jquery');
var Backbone = require('backbone');
var BaseDialog = require('../../views/base_dialog/view');
var OptionView = require('./publish_option_view');

/**
 * Delete items dialog
 */
module.exports = BaseDialog.extend({

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
    this._options = new Backbone.Collection();
    var publicUrlOption = new cdb.core.Model({
      title: 'Get the link',
      desc: 'And send it to your friends, co-workers or post in your social networks',
      iconName: 'Heart--fill',
      iconCategory: 'positive',
      loadingCopyable: true
    });
    this._options.add(publicUrlOption);

    // Shorten the public URL if possible, update
    var publicURL = this.model.publicURL();
    var urlShortener = new cdb.editor.UrlShortener();
    urlShortener.fetch(publicURL, {
      success: function(shortenedUrl) {
        publicUrlOption.set({
          loadingCopyable: false,
          copyable: shortenedUrl
        });
      },
      error: function(originalUrl) {
        publicUrlOption.set({
          loadingCopyable: false,
          copyable: originalUrl
        });
      }
    });

    var embedURL = this.model.embedURL();
    this._options.add(
      new cdb.core.Model({
        title: 'Embed it',
        desc: 'Get your map into your blog, website or simple application. <a href="' + embedURL + '" target="_blank">Get a simple URL</a>',
        iconName: 'Heart--fill',
        iconCategory: 'royal',
        copyable: '<iframe width="100%" height="520" frameborder="0" src="' + embedURL + '" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>'
      })
    );

    this._options.add(
      new cdb.core.Model({
        title: 'CartoDB.js',
        desc: 'Add your map to your applications by using this URL. <a href="http://docs.cartodb.com/cartodb-platform/cartodb-js.html" target="_blank">Read more</a>',
        iconName: 'Heart--fill',
        iconCategory: 'lingon',
        copyable: this.model.vizjsonURL()
      })
    );
  }

});
