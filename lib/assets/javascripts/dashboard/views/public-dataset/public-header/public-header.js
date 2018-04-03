const _ = require('underscore');
const $ = require('jquery');
const CoreView = require('backbone/core-view');
const PublicDropdown = require('dashboard/views/public-dataset/public-dropdown');
const template = require('./public-header.tpl');

/**
 *  Public header, dance starts!
 *
 */
module.exports = CoreView.extend({
  initialize: function () {
    this.vis = this.options.vis;
    this.template = template;
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(
      this.template(
        _.defaults({
          vis_url: this.vis && this.vis.viewUrl(this.model) || '',
          isMobileDevice: this.options.isMobileDevice,
          owner_username: this.options.owner_username,
          current_view: this.options.current_view,
          isCartoDBHosted: this.options.isCartoDBHosted
        }, this.model.attributes)
      )
    );
    this._initViews();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change', this.render, this);
  },

  _initViews: function () {
    if (this.$('.account').length > 0) {
      var dropdown = new PublicDropdown({
        target: this.$('a.account'),
        model: this.model,
        vertical_offset: 20,
        width: 166
      });

      this.addView(dropdown);
      $('body').append(dropdown.render().el);
    }
  }

});
