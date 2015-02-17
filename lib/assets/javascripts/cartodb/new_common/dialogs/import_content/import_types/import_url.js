var cdb = require('cartodb.js');
var cdbAdmin = require('cdb.admin');
var Utils = require('cdb.Utils');
var ImportModel = require('new_common/dialogs/import_content/import_model');
var UploadModel = require('new_common/upload_model');

/**
 *  Import url panel
 *
 *  - It accepts an url
 *  - It checks if it is valid
 *
 */


module.exports = cdb.core.View.extend({

  events: {
    'click .js-back': '_moveBack',
    'submit .js-form': '_onFormSubmit'
  },

  className: 'ImportPanel ImportUrlPanel',

  initialize: function() {
    this.user = this.options.user;
    this.model = new UploadModel({
      type: 'url'
    });

    this.template = cdb.templates.getTemplate('new_common/views/create/listing/import_types/import_url');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.append(this.template());
    this._initViews();
    return this;
  },

  _initViews: function() {
    // Import header
    // Import form
    // Import selected
  },

  _initBinds: function() {
    this.model.bind('change:state', this._onStateChange, this);
  },

  _isValidURL: function(str) {
    return Utils.isURL(str)
  },

  _onFormSubmit: function(e) {
    if (e) this.killEvent(e);

    var value = this.$('.js-input').val();

    if (this._isValidURL(value)) {
      this.model.set({
        value: value,
        state: 'selected'
      });
    } else {
      console.log("TODO: error state");
    }
  },

  _moveBack: function() {
    this.model.set('state', 'idle');
  },

  _onStateChange: function(m, state, c) {
    // Show proper state
    this.$('.ImportPanel-state').hide();
    this.$('.ImportPanel-state.is-' + state).show();
    // if (pos && pos.left) {
    //   var current_margin = (this.$('.ImportPanel-bodyWrapper').css('margin-left')).replace(/px/g,'');
    //   this.$('.ImportPanel-bodyWrapper').css('margin-left', current_margin - pos.left + 'px');  
    // }

    // // Toggle back button
    // this.$('.ImportPanel-headerButton')[ state === "selected" ? 'addClass' : 'removeClass']('is-active');
  }

})