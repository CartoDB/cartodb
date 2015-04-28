var cdb = require('cartodb.js');
var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var BaseDialog = require('../../views/base_dialog/view');
var OptionView = require('./publish_option_view');
var OptionModel = require('./publish_option_model');

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
    this._options.add(
      new OptionModel({
        title: 'Get the link',
        desc: 'And send it to your friends, co-workers or post in your social networks',
        iconName: 'Heart--fill',
        iconCategory: 'positive'
      })
    );
    this._options.add(
      new OptionModel({
        title: 'Embed it',
        desc: 'Get your map into your blog, website or simple application. Get a simple URL',
        iconName: 'Heart--fill',
        iconCategory: 'royal'
      })
    );
    this._options.add(
      new OptionModel({
        title: 'CartoDB.js',
        desc: 'Add your map to your applications by using this URL. <a href="http://developers.cartodb.com/documentation/cartodb-js.html">Read more</a>',
        iconName: 'Heart--fill',
        iconCategory: 'lingon'
      })
    );
  }

});
