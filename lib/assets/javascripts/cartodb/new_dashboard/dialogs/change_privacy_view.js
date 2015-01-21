var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var _ = require('underscore');
var PrivacyOptions = require('./change_privacy/options_collection');

/**
 * Change privacy datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  events: function() {
    return _.extend({}, BaseDialog.prototype.events, {
      'click .js-option' : '_selectOption',
      'click .js-ok' : '_save'
    });
  },

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/template');
    this.vis = this.options.vis; // of model cdb.admin.Visualization
    this.user = this.options.user;
    this.options = PrivacyOptions.byVisAndUser(this.vis, this.user);
    
    this.options.bind('change', this.render, this);
    this.add_related_model(this.options);
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this.template({
      itemName: this.vis.get('name'),
      options: this.options
    });
  },
  
  cancel: function() {
    this.clean();
  },
  
  _selectOption: function(ev) {
    this.options.at(
      $(ev.target).closest('.js-option').attr('data-index')
    )
      .set('selected', true);
  },
  
  _save: function(ev) {
    this.killEvent(ev);
    this.undelegateEvents();
    
    var self = this;
    this.options
      .find(function(option) {
        return option.get('selected');
      })
      .saveToVis(this.vis)
      .done(function() {
        self.close();
      })
      .fail(function() {
        self.delegateEvents();
      });
  }
});
