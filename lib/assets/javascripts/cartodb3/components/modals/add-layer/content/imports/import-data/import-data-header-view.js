var cdb = require('cartodb.js');
var template = require('./import-data-header.tpl');

/**
 *  Data header view
 *
 *  - It will change when upload state changes
 *  - Possibility to change state with a header button
 *
 */

module.exports = cdb.core.View.extend({
  events: {
    'click .js-back': '_goToStart'
  },

  options: {
    fileEnabled: false,
    acceptSync: false
  },

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');

    this._userModel = opts.userModel;
    this.template = opts.template || template;
    this._initBinds();
    this._checkVisibility();
  },

  render: function () {
    var acceptSync = this.options.acceptSync && this._userModel.get('actions') && this._userModel.isActionEnabled('sync_tables') && this.model.get('type') !== 'file';

    this.$el.html(
      this.template({
        type: this.model.get('type'),
        fileEnabled: this.options.fileEnabled,
        acceptSync: acceptSync,
        state: this.model.get('state')
      })
    );
    this._checkVisibility();
    return this;
  },

  _initBinds: function () {
    this.model.bind('change:state', this.render, this);
  },

  _checkVisibility: function () {
    this.show();
  },

  _goToStart: function () {
    this.model.set('state', 'idle');
  }

});
