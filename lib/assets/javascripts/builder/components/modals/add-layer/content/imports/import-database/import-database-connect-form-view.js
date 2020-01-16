var $ = require('jquery');
// var checkAndBuildOpts = require('builder/helpers/required-opts');
var CoreView = require('backbone/core-view');
var template = require('./import-database-connect-form.tpl');
var sidebarTemplate = require('./import-database-sidebar.tpl');

// var REQUIRED_OPTS = [
//   'userModel',
//   'configModel',
//   'service'
// ];

module.exports = CoreView.extend({

  events: {
    'keyup .js-textInput': '_onTextChanged',
    'submit .js-form': '_onSubmitForm'
  },

  initialize: function (opts) {
    // checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(template(this.options));
    this._addSidebar();
    return this;
  },

  _addSidebar: function () {
    this.$el.find('.ImportPanel-sidebar').append(
      sidebarTemplate(this.options)
    );
  },

  _onTextChanged: function () {
    (this._isFormFilled() ? $('.js-submit').removeClass('is-disabled') : $('.js-submit').addClass('is-disabled'));
  },

  _isFormFilled: function () {
    return $('.js-server').val() !== '' &&
           $('.js-port').val() !== '' &&
           $('.js-database').val() !== '' &&
           $('.js-username').val() !== '' &&
           $('.js-password').val() !== '';
  },

  _onSubmitForm: function (e) {
    if (e) this.killEvent(e);
  },

  _checkConnection: function () {

  }
});
