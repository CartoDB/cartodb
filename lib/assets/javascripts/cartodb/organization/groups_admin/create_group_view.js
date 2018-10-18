var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var randomQuote = require('../../common/view_helpers/random_quote');

/**
 * View to create a new group for an organization.
 */
module.exports = cdb.core.View.extend({

  tagName: 'form',

  events: {
    'click .js-create': '_onClickCreate',
    'submit form': '_onClickCreate',
    'keyup .js-name': '_onChangeName'
  },

  initialize: function () {
    _.each(['group', 'onCreated', 'flashMessageModel'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);

    this.model = new cdb.core.Model();
    this._initBinds();
  },

  render: function () {
    if (this.model.get('isLoading')) {
      this.$el.html(
        this.getTemplate('common/templates/loading')({
          title: 'Creating group',
          quote: randomQuote()
        })
      );
    } else {
      this.$el.html(
        this.getTemplate('organization/groups_admin/create_group')({
        })
      );
    }
    return this;
  },

  _initBinds: function () {
    this.model.on('change:isLoading', this.render, this);
  },

  _onClickCreate: function (ev) {
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

  _showErrors: function (m, res, req) {
    this.model.set('isLoading', false);

    var str;
    try {
      str = res && JSON.parse(res.responseText).errors.join('. ');
    } catch (err) {
      str = 'Could not create group for some unknown reason, please try again';
    }

    this.options.flashMessageModel.show(str);
  },

  _onChangeName: function () {
    this.options.flashMessageModel.hide();
    this.$('.js-create').toggleClass('is-disabled', this._name().length === 0);
  },

  _name: function () {
    return this.$('.js-name').val();
  }

});
