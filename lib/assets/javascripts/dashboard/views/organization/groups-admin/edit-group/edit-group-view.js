const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const template = require('./edit-group.tpl');
const loadingTemplate = require('builder/components/loading/loading.tpl');
const randomQuote = require('builder/components/loading/random-quote');

const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'onSaved',
  'onDeleted',
  'flashMessageModel'
];

/**
 * View to edit an organization group.
 */
module.exports = CoreView.extend({
  tagName: 'form',

  events: {
    'click .js-delete': '_onClickDelete',
    'click .js-save': '_onClickSave',
    'submit form': '_onClickSave',
    'keyup .js-name': '_onChangeName'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.model = new Backbone.Model();
    this._initBinds();
  },

  render: function () {
    if (this.model.get('isLoading')) {
      this.$el.html(
        loadingTemplate({
          title: this.model.get('loadingText'),
          descHTML: randomQuote()
        })
      );
    } else {
      this.$el.html(
        template({ displayName: this._group.get('display_name') })
      );
    }
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:isLoading', this.render);
  },

  _onClickSave: function (ev) {
    this.killEvent(ev);

    var name = this._name();

    if (name && name !== this._group.get('display_name')) {
      this._setLoading('Saving changes');
      this._group.save(
        { display_name: name },
        {
          wait: true,
          success: this.options.onSaved,
          error: this._showErrors.bind(this)
        });
    }
  },

  _onClickDelete: function (ev) {
    this.killEvent(ev);

    this._setLoading('Deleting group');
    this._group.destroy({
      wait: true,
      success: this._onDeleted,
      error: this._showErrors.bind(this)
    });
  },

  _setLoading: function (msg) {
    this._flashMessageModel.hide();

    this.model.set({
      isLoading: !!msg,
      loadingText: msg
    });
  },

  _showErrors: function (message, response, request) {
    this._setLoading('');

    const jsonData = response && response.responseJSON;
    let flashMessage = 'Could not update group for some unknown reason, please try again';

    if (jsonData.errors) {
      flashMessage = jsonData.errors.join('. ');
    }

    this._flashMessageModel.show(flashMessage);
  },

  _onChangeName: function () {
    this.$('.js-save').toggleClass('is-disabled', this._name().length === 0);
    this._flashMessageModel.hide();
  },

  _name: function () {
    return this.$('.js-name').val();
  }

});
