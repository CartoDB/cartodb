
/**
 * common header for map/table views
 */

var OptionsMenu = cdb.admin.DropdownMenu.extend({
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
    'click .clearview':           'clearView',
    'click .status':              '_addPrivacySelector',
    'click .change_title':        '_changeTitle',
    'click .table_description p': '_changeDescription',
    'click .georeference':        'georeference',
    'click span.tags > *':        '_changeTags'
  },

  initialize: function() {
    var self = this;

    this.table = this.model;
    this.table.bind('change', this.tableInfo, this);
    this.table.bind('change:dataSource', this.onSQLView, this);
    this.add_related_model(this.table);
    this.$('.clearview').hide();

    // User menu
    this.user_menu = new cdb.admin.DropdownMenu({
      target: $('a.account'),
      model: { username: this.options.user.get('username') },
      username: this.options.user.get('username'),
      template_base: 'common/views/settings_item'
    }).bind("onDropdownShown",function(ev) {
      cdb.god.unbind("closeDialogs", self.user_menu.hide, self.user_menu);
      cdb.god.trigger("closeDialogs"); 
      cdb.god.bind("closeDialogs", self.user_menu.hide, self.user_menu);
    });

    cdb.god.bind("closeDialogs", this.user_menu.hide, this.user_menu);
    $('body').append(this.user_menu.render().el);
    this.addView(this.user_menu);

    // Options menu
    this.options_menu = new OptionsMenu({
      target: $('a.options'),
      model: { username: this.options.user.get('username') },
      username: this.options.user.get('username'),
      table: this.table,
      template_base: 'table/views/header_table_options'
    }).bind("onDropdownShown",function(ev) {
      cdb.god.unbind("closeDialogs", self.options_menu.hide, self.options_menu);
      cdb.god.trigger("closeDialogs"); 
      cdb.god.bind("closeDialogs", self.options_menu.hide, self.options_menu);
    });
    cdb.god.bind("closeDialogs", this.options_menu.hide, this.options_menu);
    $('body').append(this.options_menu.render().el);
    this.addView(this.options_menu);


    if(this.table.isInSQLView()) {
      this.onSQLView();
    }
  },

  setDataLayer: function(dl) {
    this.dataLayer = dl;
  },

  georeference: function(e) {
    e.preventDefault();
    var dlg = new cdb.admin.GeoreferenceDialog({
      model: this.table,
      geocoder: this.options.geocoder
    });
    dlg.appendToBody().open();
  },

  tableInfo: function() {
    this.$('h2.special a').html(this.table.get('name'));
    
    this.$('.status')
      .addClass(this.table.get('privacy').toLowerCase())
      .html(this.table.get('privacy'));
    
    this.$('.table_description p').text(this.table.get('description') || 'add a description...');
    
    if (this.table.get('tags')) {
      var tags = this.table.get('tags').split(",")
        , html = '<p>';

      _.each(tags, function(tag,i) {
        html += "<em>" + tag + "</em>";
      });

      this.$('span.tags').html(html + "</p>");
      this.$('span.tags').append("<a href='#edit_tags'>edit tags</a>");
    } else {
      this.$('span.tags').html("<a href='#add_tags'>add tags</a>");
    }
  },

  onSQLView: function() {
    if(this.table.isInSQLView()) {
      this.$('.clearview').show();
      this.$el.addClass('query');
      this.$('.status').hide();
      this.$('.georeference').parent().hide();
    } else {
      this.$('.clearview').hide();
      this.$el.removeClass('query');
      this.$('.status').show();
      this.$('.georeference').parent().show();
    }
  },

  clearView: function(e) {
    e.preventDefault();
    this.dataLayer && this.dataLayer.save({ query: null });
    $.faviconNotify('/favicons/cartofante_blue.png');
    return false;
  },

  _addPrivacySelector: function(ev) {
    ev.preventDefault();

    this.privacy && this.privacy.clean();
    cdb.god.trigger("closeDialogs");

    // Add privacy selector
    var privacy = this.privacy = new cdb.admin.PrivacySelector({
      model: this.table,
      direction: 'down'
    });

    cdb.god.bind("closeDialogs", this.privacy.hide, this.privacy);

    this.$el.parent().append(this.privacy.render().el);

    this.privacy.show($(ev.target),"offset");

    return false;
  },

  _changeDescription: function(e) {
    var self = this;
    e.preventDefault();
    e.stopPropagation();

    this.description_dialog && this.description_dialog.clean();
    cdb.god.trigger("closeDialogs");

    var description_dialog = this.description_dialog = new cdb.admin.EditTextDialog({
      initial_value: this.table.get('description') || '',
      template_name: 'table/views/edit_name',
      clean_on_hide: true,
      modal_class: 'edit_name_dialog',
      res: function(val) {
        if(val !== self.model.get('description')) {
          self.model.save({ description: val });
        }
      }
    });

    cdb.god.bind("closeDialogs", description_dialog.hide, description_dialog);

    var pos = $(e.target).offset();
    pos.left -= $(window).scrollLeft();
    pos.top -= $(window).scrollTop();
    var w = Math.max($(e.target).width() + 100, 280);

    description_dialog.showAt(pos.left - 20, pos.top - 13, w);
  },

  _changeTitle: function(e) {
    var self = this;
    e.preventDefault();
    e.stopPropagation();

    this.title_dialog && this.title_dialog.clean();
    cdb.god.trigger("closeDialogs");

    var title_dialog = this.title_dialog = new cdb.admin.EditTextDialog({
      initial_value: this.table.get('name'),
      template_name: 'table/views/edit_name',
      clean_on_hide: true,
      modal_class: 'edit_name_dialog',
      res: function(val) {
        if(val !== self.model.get('name')) {
          var confirmation = new cdb.admin.RenameConfirmationDialog({
            model: self.table,
            newName: val
          });
          confirmation.appendToBody().open();
        }
      }
    });

    cdb.god.bind("closeDialogs", title_dialog.hide, title_dialog);

    // when the table has horizontal scroll for some reason
    // object offset returned has the scroll added
    var pos = $(e.target).offset();
    pos.left -= $(window).scrollLeft()
    pos.top -= $(window).scrollTop()
    var w = Math.max($(e.target).width() + 100, 280);
    title_dialog.showAt(pos.left - 20, pos.top - 13, w);
  },

  _changeTags: function(e) {
    var self = this;
    e.preventDefault();
    e.stopPropagation();

    this.tags_dialog && this.tags_dialog.clean();
    cdb.god.trigger("closeDialogs");

    var tags_dialog = this.tags_dialog = new cdb.admin.TagsDialog({
      initial_value: this.table.get('tags'),
      template_name: 'table/views/edit_name',
      clean_on_hide: true,
      modal_class: 'edit_name_dialog',
      res: function(val) {
        if(val !== self.model.get('tags')) {
          self.model.save({ tags: val });
        }
      }
    });

    cdb.god.bind("closeDialogs", tags_dialog.hide, tags_dialog);

    // when the table has horizontal scroll for some reason
    // object offset returned has the scroll added
    var $tags = $(e.target).closest("span.tags") 
    var pos = $tags.offset();
    pos.left -= $(window).scrollLeft();
    pos.top -= $(window).scrollTop() + 6;

    var w = Math.max($tags.find("p").width() + 100, 280);
    tags_dialog.showAt(pos.left - 20, pos.top - 13);
  }
});
