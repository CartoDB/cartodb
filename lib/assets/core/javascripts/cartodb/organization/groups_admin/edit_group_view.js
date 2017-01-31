var _ = require('underscore-cdb-v3');
var cdb = require('cartodb.js-v3');
var randomQuote = require('../../common/view_helpers/random_quote');

/**
 * View to edit an organization group.
 */
module.exports = cdb.core.View.extend({

  tagName: 'form',

  events: {
    'click .js-delete': '_onClickDelete',
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave',
    'keyup .js-name': '_onChangeName'
  },

  initialize: function () {
    _.each(['group', 'onSaved', 'onDeleted', 'flashMessageModel'], function (name) {
      if (!this.options[name]) throw new Error(name + ' is required');
    }, this);
    this.model = new cdb.core.Model();
    this._initBinds();
  },

  render: function () {
    if (this.model.get('isLoading')) {
      this.$el.html(
        this.getTemplate('common/templates/loading')({
          title: this.model.get('loadingText'),
          quote: randomQuote()
        })
      );
    } else {
      this.$el.html(
        this.getTemplate('organization/groups_admin/edit_group')({
          displayName: this.options.group.get('display_name')
        })
      );
    }
    return this;
  },

  _initBinds: function () {
    this.model.on('change:isLoading', this.render, this);
  },

  _onClickSave: function (ev) {
    this.killEvent(ev);
    var name = this._name();
    if (name && name !== this.options.group.get('display_name')) {
      this._setLoading('Saving changes');
      this.options.group.save({
        display_name: name
      }, {
        wait: true,
        success: this.options.onSaved,
        error: this._showErrors.bind(this)
      });
    }
  },

  _onClickDelete: function (ev) {
    this.killEvent(ev);
    this._setLoading('Deleting group');
    this.options.group.destroy({
      wait: true,
      success: this.options.onDeleted,
      error: this._showErrors.bind(this)
    });
  },

  _setLoading: function (msg) {
    this.options.flashMessageModel.hide();
    this.model.set({
      isLoading: !!msg,
      loadingText: msg
    });
  },

  _showErrors: function (m, res, req) {
    this._setLoading('');

    var str;
    try {
      str = res && JSON.parse(res.responseText).errors.join('. ');
    } catch (err) {
      str = 'Could not update group for some unknown reason, please try again';
    }

    this.options.flashMessageModel.show(str);
  },

  _onChangeName: function () {
    this.$('.js-save').toggleClass('is-disabled', this._name().length === 0);
    this.options.flashMessageModel.hide();
  },

  _name: function () {
    return this.$('.js-name').val();
  }

});
