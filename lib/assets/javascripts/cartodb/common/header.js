
/**
 * common header for map/table views
 */

var OptionsMenu = cdb.admin.UserMenu.extend({
  events: {
    'click .export': '_export',
    'click .duplicate': '_duplicate',
    'click .append': '_append',
    'click .delete_table': '_delete'
  },

  _export: function(e){
    e.preventDefault();
    var export_dialog = new cdb.admin.ExportTableDialog({
      model: this.options.table
    });
    $("body").append(export_dialog.render().el);
    export_dialog.open();
  },
  _duplicate: function(e){
    e.preventDefault();
  },
  _append: function(e){
    e.preventDefault();
  },
  _delete: function(e){
    e.preventDefault();
    var delete_dialog = new cdb.admin.DeleteDialog({
      model: this.options.table,
      ok: function() {
        location = "/dashboard";
      }
    });

    $("body").append(delete_dialog.render().el);
    delete_dialog.open();
  }
});

cdb.admin.Header = cdb.core.View.extend({

  events: {
    'click .clearview': 'clearView',
    'click .status': '_addPrivacySelector',
    'click .change_title': '_changeTitle',
    'click .table_description': '_changeDescription',
    'click .georeference': 'georeference'
  },

  initialize: function() {
    this.table = this.model;
    this.table.bind('change', this.tableName, this);
    this.table.bind('change:dataSource', this.onSQLView, this);
    this.add_related_model(this.table);
    this.$('.clearview').hide();
    this.user_menu = new cdb.admin.UserMenu({
      target: 'a.account',
      model: { username: this.options.user.get('username') },
      username: this.options.user.get('username'),
      template_base: 'dashboard/views/settings_item'
    });
    cdb.god.bind("closeDialogs", this.user_menu.hide, this.user_menu);
    $('body').append(this.user_menu.render().el);

    this.options_menu = new OptionsMenu({
      target: 'a.options',
      model: { username: this.options.user.get('username') },
      username: this.options.user.get('username'),
      table: this.table,
      template_base: 'table/views/header_table_options'
    });
    cdb.god.bind("closeDialogs", this.options_menu.hide, this.options_menu);
    $('body').append(this.options_menu.render().el);
  },

  georeference: function(e) {
    e.preventDefault();
    var dlg = new cdb.admin.GeoreferenceDialog({
      model: this.table
    });
    dlg.appendToBody().open();
  },

  tableName: function() {
    this.$('h2.special a').html(this.table.get('name'));
    this.$('.status')
      .addClass(this.table.get('privacy').toLowerCase())
      .html(this.table.get('privacy'));
    this.$('.table_description').html(this.table.get('description') || 'description here');
  },

  onSQLView: function() {
    //TODO: change header 

    var color = this.table.sqlView ? 'orange': 'blue';
    this.$el.css({
      'background-color': color
    });
    if(this.table.isInSQLView()) {
      this.$('.clearview').show();
    } else {
      this.$('.clearview').hide();
    }
  },

  clearView: function(e) {
    e.preventDefault();
    this.table.useSQLView(null);
    return false;
  },

  _addPrivacySelector: function(ev) {
    ev.preventDefault();

    this.privacy && this.privacy.clean();

    // Add privacy selector
    var privacy = this.privacy = new cdb.admin.PrivacySelector({
      model: this.table,
      direction: 'down'
    });

    cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

    this.$el.append(this.privacy.render().el);

    this.privacy.show(ev.target);
    return false;
  },

  _changeDescription: function(e) {
    var self = this;
    e.preventDefault();
    var dlg = new cdb.admin.EditTextDialog({
      initial_value: this.table.get('description') || '',
      template_name: 'table/views/edit_name',
      modal_class: 'edit_name_dialog',
      res: function(val) {
        if(val !== self.model.get('description')) {
          self.model.save({ description: val });
        }
      }
    });
    var pos = $(e.target).offset();
    pos.left -= $(window).scrollLeft()
    pos.top -= $(window).scrollTop()
    dlg.showAt(pos.left - 20, pos.top - 13);
  },

  _changeTitle: function(e) {
    var self = this;
    e.preventDefault();
    var dlg = new cdb.admin.EditTextDialog({
      initial_value: this.table.get('name'),
      template_name: 'table/views/edit_name',
      modal_class: 'edit_name_dialog',
      res: function(val) {
        if(val !== self.model.get('name')) {
          var confirmation = new cdb.admin.RenameConfirmationDialog({
            model: self.table,
            newName: val
          });
          confirmation.appendToBody().show();
        }
      }
    });

    // when the table has horizontal scroll for some reason
    // object offset returned has the scroll added
    var pos = $(e.target).offset();
    pos.left -= $(window).scrollLeft()
    pos.top -= $(window).scrollTop()
    dlg.showAt(pos.left - 20, pos.top - 13);
  }
});
