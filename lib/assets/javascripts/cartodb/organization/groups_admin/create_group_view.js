var _ = require('underscore');
var cdb = require('cartodb.js');
var randomQuote = require('../../common/view_helpers/random_quote');

/**
 * View to create a new group for an organization.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-create': '_onClickCreate',
    'keyup .js-name': '_onChangeName'
  },

  initialize: function() {
    _.each(['group', 'onCreated'], function(name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

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
      html = this.getTemplate('organization/groups_admin/create_group')({
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
      this.options.group.save({
        display_name: name
      }, {
        wait: true,
        success: this.options.onCreated,
        error: this._showErrors.bind(this)
      });
    }
  },

  _showErrors: function() {
    this.model.set('isLoading', false);
  },

  _onChangeName: function() {
    this.$('.js-create').toggleClass('is-disabled', this._name().length === 0);
  },

  _name: function() {
    return this.$('.js-name').val();
  }

});
