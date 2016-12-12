var cdb = require('cartodb.js-v3');
var BaseDialog = require('../../views/base_dialog/view');
var CreateContent = require('./create_content');

/**
 *  Create view dialog
 *
 *  It let user create a new dataset or map, just
 *  decide the type before creating this dialog, by default
 *  it will help you to create a map.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog is-opening CreateDialog',

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/views/create/dialog_template');
    this._initBinds();
  },

  render: function() {
    BaseDialog.prototype.render.call(this);
    this.$('.content').addClass('Dialog-content--expanded');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initBinds: function() {
    cdb.god.bind('importByUploadData', this.close, this);
    this.add_related_model(cdb.god);
  },

  _initViews: function() {
    var createContent = new CreateContent({
      el: this.$el,
      model: this.model,
      user: this.user
    });
    createContent.render();
    this.addView(createContent);
  }

});
