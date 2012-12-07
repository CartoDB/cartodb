/**
 * All tags dialog where user can find any tag applied in his tables
 */

cdb.admin.AllTagsDialog = cdb.admin.BaseDialog.extend({

  events: function(){
    return _.extend({},cdb.admin.BaseDialog.prototype.events,{
      'click li a': 'hide'
    });
  },

  initialize: function() {
    // Extend options
    _.extend(this.options, {
      title: 'All your tags',
      description: '',
      template_name: 'common/views/dialog_base',
      include_footer: false,
      modal_type: "creation",
      modal_class: "all_tags",
      width: 700
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return this.getTemplate('dashboard/views/all_tags_dialog')({ attributes: this.model.toJSON() });
  }
});
