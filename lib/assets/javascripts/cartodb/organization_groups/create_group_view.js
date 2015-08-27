var cdb = require('cartodb.js');
var randomQuote = require('../common/view_helpers/random_quote');

/**
 * View to create a new group for an organization.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-create': '_onClickCreate',
    'keyup .js-name': '_onChangeName'
  },

  initialize: function() {
    if (!this.options.groups) throw new Error('groups is required');
    this.model = new cdb.core.Model();
    this._initBinds();
  },

  render: function() {
    var html;
    if (this.model.get('isLoading')) {
      html = this.getTemplate('common/templates/loading')({
        title: 'Creating group',
        quote: randomQuote()
      });
    } else {
      html = this.getTemplate('organization_groups/create_group')({
      });
    }
    this.$el.html(html);
    return this;
  },

  _initBinds: function() {
    this.model.on('change:isLoading', this.render, this);
  },

  _onClickCreate: function(ev) {
    this.killEvent(ev);
    var name = this._name();
    if (name) {
      this.model.set('isLoading', true);
      this.options.groups.create({
        display_name: name
      }, {
        wait: true,
        success: this._redirectToGroupsIndex.bind(this),
        error: this._showErrors.bind(this)
      });
    }
  },

  _redirectToGroupsIndex: function() {
    // Redirect back to list
    this.options.router.navigate(this.options.router.rootUrl, { trigger: true });
  },

  _showErrors: function() {
    this.model.set({
      isLoading: false
    });
  },

  _onChangeName: function() {
    this.$('.js-create').toggleClass('is-disabled', this._name().length === 0);
  },

  _name: function() {
    return this.$('.js-name').val();
  }

});
