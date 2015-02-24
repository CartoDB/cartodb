var cdb = require('cartodb.js');
var BaseDialog = require('../../../../../javascripts/cartodb/new_common/views/base_dialog/view');
var ConnectDatasetModel = require('../../../../../javascripts/cartodb/new_common/dialogs/connect_dataset/connect_dataset_model');
var ImportDefaults = require('../../../../../javascripts/cartodb/new_common/dialogs/import_content/import_defaults');
var ConnectDatasetContent = require('../../../../../javascripts/cartodb/new_common/dialogs/connect_dataset/connect_dataset_content');


/**
 *  Connect dataset dialog
 */

var View = BaseDialog.extend({

  className: 'Dialog ConnectDialog',

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('new_common/views/connect_dataset/dialog_template');

    this.options = _.extend(this.options, ImportDefaults);

    this.model = new ConnectDatasetModel({
      option: this.options.selected_option
    });

    this._initBinds();
  },

  render_content: function() {
    var $el = $(this.template());

    var connectDatasetContent = new ConnectDatasetContent({
      el: $el.find('.ConnectDialog-body'),
      model: this.model,
      user: this.user,
      file_extensions: this.options.file_extensions,
      enabled_panels: this.options.enabled_panels
    });
    connectDatasetContent.render();
    this.addView(connectDatasetContent);

    this._resizeWindow();

    return $el;
  },

  _initBinds: function() {
    $(window).on('resize', this._resizeWindow);
  },

  _disableBinds: function() {
    $(window).off('resize', this._resizeWindow);
  },

  _resizeWindow: function() {
    // Make content body min height enough
    this.$('.ConnectDialog-body').css('min-height', $(window).height() - 169);
  },

  clean: function() {
    this._disableBinds();
    this.elder('clean');
  }

});

module.exports = View;
