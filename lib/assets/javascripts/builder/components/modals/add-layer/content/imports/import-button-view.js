var _ = require('underscore');
var CoreView = require('backbone/core-view');
var UploadModel = require('builder/data/upload-model');
var template = require('./import-item.tpl');

/**
 *  Default view for an import item
 *
 *  - It is based in an upload model.
 *  - Will trigger a change when model changes.
 *  - It returns their data if it is requested with a method.
 */

module.exports = CoreView.extend({
  options: {
    title: '',
    name: '',
    importView: ''
  },

  className: 'ImportOptions__item',
  tagName: 'button',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.createModel) throw new Error('createModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._createModel = opts.createModel;
    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
  },

  render: function () {
    this.$el.html(
      template({
        name: this.options.name,
        title: this.options.title
      })
    );
    return this;
  },

  _onClick: function () {
    this.trigger('importSelected', this);
  }

});
