var cdb = require('cartodb.js');
var randomQuote = require('../common/view_helpers/random_quote');

/**
 * View to edit an organization group.
 */
module.exports = cdb.core.View.extend({

  events: {
    'click .js-delete': '_onClickDelete',
    'click .js-save': '_onClickSave',
    'keyup .js-name': '_onChangeName'
  },

  initialize: function() {
    if (!this.options.group) throw new Error('group is required');

    this.model = new cdb.core.Model();

    // No display name? Not fetched yet (e.g. on a full page request)
    if (!this.options.group.get('display_name')) {
      this._setLoading('Loading details');
      this.options.group.fetch({
        success: this._setLoading.bind(this, false),
        error: this._redirectToGroupsIndex.bind(this)
      });
    }
    this._initBinds();
  },

  render: function() {
    var html;
    if (this.model.get('isLoading')) {
      html = this.getTemplate('common/templates/loading')({
        title: this.model.get('loadingText'),
        quote: randomQuote()
      });
    } else {
      html = this.getTemplate('organization_groups/edit_group')({
        displayName: this.options.group.get('display_name')
      });
    }
    this.$el.html(html);
    return this;
  },

  _initBinds: function() {
    this.model.on('change:isLoading', this.render, this);
  },

  _setLoading: function(msg) {
    this.model.set({
      isLoading: !!msg,
      loadingText: msg
    });
  },

  _onClickSave: function(ev) {
    this.killEvent(ev);
    var name = this._name();
    if (name && name !== this.options.group.get('display_name')) {
      this._setLoading('Saving changes');
      this.options.group.save({
        display_name: name
      }, {
        wait: true,
        success: this._redirectToGroupsIndex.bind(this),
        error: this._showErrors.bind(this)
      });
    }
  },

  _onClickDelete: function() {
    this._setLoading('Deleting group');
    this.options.group.destroy({
      wait: true,
      success: this._redirectToGroupsIndex.bind(this),
      error: this._showErrors.bind(this)
    });
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
    this.$('.js-save').toggleClass('is-disabled', this._name().length === 0);
  },

  _name: function() {
    return this.$('.js-name').val();
  }

});
