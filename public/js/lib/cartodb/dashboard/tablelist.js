
cdb.admin.dashboard = cdb.admin.dashboard || {};

(function() {

  /**
   * dasboard table list item
   */
  var TableView = cdb.core.View.extend({

    tagName: 'li',

    events: {
      "click a.status": "_addPrivacySelector",
      "click a.delete": "_showDeleteConfirmation",
    },

    initialize: function() {
      this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');

      this.model.bind('destroy', this.clean, this);
      this.model.bind('change', this.render, this);
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));

      return this;
    },

    _addPrivacySelector: function(ev) {
      ev.preventDefault();

      var privacy = new cdb.admin.PrivacySelector({
        model: this.model
      })
      
      this.$el.append(privacy.render().el);

      privacy.show();
    },

    _showDeleteConfirmation: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var delete_dialog = new cdb.admin.DeleteDialog({
        clean_on_hide: true,
        title: "",
        content: "",
        ok_button_classes: "button grey",
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        model: this.model
      });

      this.$el.append(delete_dialog.render().el);
      delete_dialog.open();
    }
  });


  /**
   * dasboard table list
   */
  var TableList = cdb.core.View.extend({
    tagName: 'ul',

    initialize: function() {
      this.model.bind('reset', this.addAll, this);
      this.model.bind('add', this.addTable, this);
    },

    addAll: function() {
      this.render();
    },

    addTable: function(m) {
      var li = new TableView({ model: m });
      this.$el.append(li.render().el);
      this.addView(li);
    },

    render: function() {
      var self = this;
      this.$el.html('');
      this.model.each(function(m) {
        self.addTable(m);
      });
    },

    _updateListHeader: function() {
      
    }
    
  });

  cdb.admin.dashboard.TableList = TableList;

})();
