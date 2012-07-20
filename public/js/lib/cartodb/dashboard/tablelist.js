
cdb.admin.dashboard = cdb.admin.dashboard || {};

(function() {

  /**
   * dasboard table list item
   */
  var TableView = cdb.core.View.extend({

    tagName: 'li',

    events: {
      "click a.status": "_addPrivacySelector",
      "click a.delete": "_showDeleteConfirmation"
    },

    initialize: function() {
      _.bindAll(this, "_addPrivacySelector");

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

      // Add privacy selector
      var privacy = this.privacy = new cdb.admin.PrivacySelector({
        model: this.model
      });

      this.$el.append(this.privacy.render().el);

      this.privacy.show(ev.target);
    },

    _showDeleteConfirmation: function(ev) {
      ev.preventDefault();
      ev.stopPropagation();

      var delete_dialog = new cdb.admin.DeleteDialog({
        clean_on_hide: true,
        title: "You are about to delete this table",
        content: "You will not be able to recover this information. We really recommend you <a href='#export' class='underline'>export the data</a> before deleting it.",
        ok_button_classes: "button grey",
        ok_title: "Delete this table",
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        model: this.model
      });

      $("body").append(delete_dialog.render().el);
      delete_dialog.open();
    }
  });


  /**
   * dasboard table list
   */
  var TableList = cdb.core.View.extend({
    tagName: 'ul',

    initialize: function() {
      this.model.bind('reset', this._addAll, this);
      this.model.bind('add', this._addTable, this);
      this.model.bind('remove', this._updateListHeader, this);
    },

    render: function() {
      var self = this;
      this.$el.html('');
      this.model.each(function(m) {
        self._addTable(m);
      });
    },

    _addAll: function() {
      this.render();
    },

    _addTable: function(m) {
      var li = new TableView({ model: m });
      this.$el.append(li.render().el);
      this.addView(li);
      this._updateListHeader();
    },

    _updateListHeader: function() {
      $("section.tables > div.head > h2").text(
        this.model.length == 1 ? this.model.length + " table in your account" :  this.model.length + " tables in your account"
      );
    }

  });

  cdb.admin.dashboard.TableList = TableList;

})();
