const CoreView = require('backbone/core-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const template = require('./import-button.tpl');
const ImportRequestView = require('./import-request-view');
const ImportRequestBetaView = require('./import-request-beta-view');
const ImportRequestSoonView = require('./import-request-soon-view');

const REQUIRED_OPTS = [
  'userModel',
  'configModel',
  'title',
  'name',
  'loaded'
];

/**
 * Import button displayed in imports selector
 */

module.exports = CoreView.extend({
  className: 'ImportButton',
  tagName: 'button',

  events: {
    'click .js-content': '_onClick'
  },

  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  render: function () {
    this.$el.html(
      template({
        name: this._name,
        title: this._title
      })
    );
    this.$el.addClass('js-' + this._name + 'Button');

    this._initViews();
    return this;
  },

  _initViews: function () {
    let importRequestView;

    if (this.options.beta) {
      importRequestView = new ImportRequestBetaView({
        el: this.$('.ImportButton__overlay'),
        name: this._name,
        title: this._title,
        userModel: this._userModel,
        configModel: this._configModel
      });
    } else if (this.options.soon) {
      importRequestView = new ImportRequestSoonView({
        el: this.$('.ImportButton__overlay'),
        name: this._name,
        title: this._title,
        userModel: this._userModel,
        configModel: this._configModel
      });
    } else {
      importRequestView = new ImportRequestView({
        el: this.$('.ImportButton__overlay'),
        name: this._name,
        title: this._title,
        userModel: this._userModel,
        configModel: this._configModel
      });
    }

    importRequestView.render();
    this.addView(importRequestView);
  },

  _onClick: function () {
    if (this._loaded) {
      this.trigger('importSelected', this);
    }
  }
});
