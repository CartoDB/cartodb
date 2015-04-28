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

    var embedURL = this.model.embedURL();
    this._options.add(
      new OptionModel({
        title: 'Embed it',
        desc: 'Get your map into your blog, website or simple application. <a href="' + embedURL + '" target="_blank">Get a simple URL</a>',
        iconName: 'Heart--fill',
        iconCategory: 'royal',
        copyable: '<iframe width="100%" height="520" frameborder="0" src="' + embedURL + '" allowfullscreen webkitallowfullscreen mozallowfullscreen oallowfullscreen msallowfullscreen></iframe>'
      })
    );
    this._options.add(
      new OptionModel({
        title: 'CartoDB.js',
        desc: 'Add your map to your applications by using this URL. <a href="http://docs.cartodb.com/cartodb-platform/cartodb-js.html" target="_blank">Read more</a>',
        iconName: 'Heart--fill',
        iconCategory: 'lingon',
        copyable: this.model.vizjsonURL()
      })
    );
  }

});
