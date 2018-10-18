var _ = require('underscore');
var CoreView = require('backbone/core-view');
var template = require('./upgrade.tpl');

var CONTACT_LINK_TEMPLATE = _.template("<a href='mailto:<%- mail %>'><%- contact %></a>")({
  contact: _t('components.modals.publish.privacy.upgrade.contact'),
  mail: _t('components.modals.publish.privacy.upgrade.mail')
});

module.exports = CoreView.extend({
  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var html = template({
      title: _t('components.modals.publish.privacy.upgrade.title'),
      desc: _t('components.modals.publish.privacy.upgrade.desc', {
        contact: CONTACT_LINK_TEMPLATE
      })
    });
    this.$el.html(html);
  }
});
