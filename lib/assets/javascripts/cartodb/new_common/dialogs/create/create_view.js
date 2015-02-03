var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var pluralizeString = require('new_common/view_helpers/pluralize_string');
var CreateModel = require('new_common/dialogs/create/create_model');
var CreateContent = require('new_common/dialogs/create/create_content');


/**
 *  Create view dialog
 *
 *  It let user create a new dataset or map, just
 *  decide the type before creating this dialog, by default
 *  it will help you to create a map.
 *
 */

var View = BaseDialog.extend({

  className: 'Dialog CreateDialog',
    
  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;

    this.model = new CreateModel({
      type: this.options.type
    })

    this.template = cdb.templates.getTemplate('new_common/views/create/dialog_template');

    this._initBinds();
  },

  render: function() {
    this.elder('render');
    this._initViews();
    return this;
  },

  render_content: function() {
    return this.template();
  },

  _initViews: function() {
    var createContent = new CreateContent({
      el: this.$el,
      model: this.model,
      user: this.user
    });
    createContent.render();
    this.addView(createContent);

    this._resizeWindow();
  },

  _initBinds: function() {
    $(window).on('resize', this._resizeWindow);
  },

  _disableBinds: function() {
    $(window).off('resize', this._resizeWindow);
  },

  _resizeWindow: function() {
    // Make content body min height enough
    this.$('.CreateDialog-body').css('min-height', $(window).height() - 169);
  },

  clean: function() {
    this._disableBinds();
    this.elder('clean');
  }

});

module.exports = View;
