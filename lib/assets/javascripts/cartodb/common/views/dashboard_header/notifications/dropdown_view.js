var cdb = require('cartodb.js-v3');
cdb.admin = require('cdb.admin');
var ScrollView = require('../../../scroll/scroll-view');
var ViewFactory = require('../../../../common/view_factory');

/**
 * User notifications dropdown, rendering notifications
 * from the collection
 */

module.exports = cdb.admin.DropdownMenu.extend({
  className: 'Dropdown',

  initialize: function() {
    cdb.admin.DropdownMenu.prototype.initialize.apply(this, arguments);
    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this.template_base());
    this._renderDropdown();

    $('body').append(this.el);

    return this;
  },

  _renderDropdown: function () {
    var view = new ScrollView({
      createContentView: function () {
        return ViewFactory.createByTemplate('common/views/dashboard_header/notifications/templates/dropdown_content', {
          items: this.collection.toJSON(),
          unreadItems: this.collection.filter(function(item){ return !item.get('opened') }).length
        });
      }.bind(this)
    });
    this.addView(view);
    this.$('.js-content').append(view.render().el);
  },

  _initBinds: function() {
    cdb.god.bind('closeDialogs', this.hide, this);
    this.add_related_model(cdb.god);
  }
});
