const $ = require('jquery');
const ScrollView = require('builder/components/scroll/scroll-view');
const ViewFactory = require('builder/components/view-factory');
const AdminDropdownMenu = require('dashboard/components/dropdown/dropdown-admin-view');
const template = require('./templates/dropdown-content.tpl');

/**
 * User notifications dropdown, rendering notifications
 * from the collection
 */

module.exports = AdminDropdownMenu.extend({
  className: 'Dropdown',

  initialize: function (options) {
    AdminDropdownMenu.prototype.initialize.apply(this, arguments);

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(this.template());
    this._renderDropdown();
    this._checkScroll();

    $('body').append(this.el);

    return this;
  },

  _renderDropdown: function () {
    this.dropdown_content = ViewFactory.createByTemplate(template, {
      items: this.collection.toJSON(),
      unreadItems: this.collection.filter(item => !item.get('opened')).length
    });
    this.addView(this.dropdown_content);

    this.$('.js-content').html(this.dropdown_content.render().el);
  },

  _checkScroll: function () {
    // we need to wait until dropdown has appeared,
    // then if it is taller than 300px we wrap the content in a ScrollView,
    // this is a fix for IE11, which needs a fixed height when using flex in a child element
    setTimeout(function () {
      if (this.$el.height() >= 300) {
        var view = new ScrollView({
          createContentView: function () {
            return this.dropdown_content;
          }.bind(this)
        });
        this.addView(view);

        this.$el.addClass('Dropdown--withScroll');
        this.$('.js-content').html(view.render().el);
      }
    }.bind(this), 301);
  },

  _initBinds: function () {
    // TODO: Handle event
    // cdb.god.bind('closeDialogs', this.hide, this);
  }
});
