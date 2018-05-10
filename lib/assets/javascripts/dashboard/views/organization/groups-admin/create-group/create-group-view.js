const Backbone = require('backbone');
const CoreView = require('backbone/core-view');
const loadingView = require('builder/components/loading/render-loading');
const createGroupTemplate = require('./create-group.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'group',
  'onCreated',
  'flashMessageModel'
];

/**
 * View to create a new group for an organization.
 */
module.exports = CoreView.extend({

  tagName: 'form',

  events: {
    'click .js-create': '_onClickCreate',
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
        loadingView({
          title: 'Creating group'
        })
      );
    } else {
      this.$el.html(createGroupTemplate());
    }
    return this;
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:isLoading', this.render);
  },

  _onClickCreate: function (ev) {
    this.killEvent(ev);

    const name = this._name();

    if (name) {
      this.model.set('isLoading', true);

      this._group.save(
        { display_name: name },
        {
          wait: true,
          success: this._onCreated,
          error: this._showErrors.bind(this)
        }
      );
    }
  },

  _showErrors: function (message, response, request) {
    this.model.set('isLoading', false);

    let flashMessage = 'Could not create group for some unknown reason, please try again';
    let jsonData;

    try {
      jsonData = response && JSON.parse(response.responseText);
    } catch (e) {
      jsonData = {};
    }

    if (jsonData && jsonData.errors) {
      flashMessage = jsonData.errors.join('. ');
    }

    this._flashMessageModel.show(flashMessage, 'error');
  },

  _onChangeName: function () {
    this._flashMessageModel.hide();
    this.$('.js-create').toggleClass('is-disabled', this._name().length === 0);
  },

  _name: function () {
    return this.$('.js-name').val();
  }

});
