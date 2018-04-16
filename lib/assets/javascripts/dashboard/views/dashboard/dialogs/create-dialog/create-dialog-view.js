const CoreView = require('backbone/core-view');
const CreateContent = require('./create-content-view');
const template = require('./create-dialog.tpl');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  ''
];

/**
 *  Create view dialog
 *
 *  It let user create a new dataset or map, just
 *  decide the type before creating this dialog, by default
 *  it will help you to create a map.
 *
 */

module.exports = CoreView.extend({
  className: 'Dialog is-opening CreateDialog',

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this.user = this.options.user;
    this._initBinds();
  },

  render: function () {
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function () {
    return template();
  },

  _initBinds: function () {
    console.error('cdb.god not defined');
    // cdb.god.bind('importByUploadData', this.close, this);
  },

  _initViews: function () {
    const createContent = new CreateContent({
      el: this.$el,
      model: this.model,
      user: this.user
    });
    createContent.render();
    this.addView(createContent);
  }

});
