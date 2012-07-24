


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
      _.bindAll(this, "_updateListHeader");

      this.model.bind('reset',    this._addAll, this);
      this.model.bind('add',      this._addTable, this);
      this.model.bind('remove',   this._tableRemoved, this);

      this.model.bind('loading',  this._showLoader, this);

    },

    render: function() {
      var self = this;
      this.$el.html('');
      this._updateListHeader();
      this.model.each(function(m) {
        self._addTable(m);
      });
    },

    _addAll: function() {
      this.render();
      this._hideLoader();
    },

    _addTable: function(m) {
      var li = new TableView({ model: m });
      this.$el.append(li.render().el);
      this.addView(li);
      this._updateListHeader();
    },

    _tableRemoved: function() {
      this._updateListHeader();
    },

    _updateListHeader: function() {

      var title =  this.model.total_entries + " " + ( this.model.total_entries != 1 ? "tables" : "table" );

      if (this.model.options.attributes.tag_name != "") 
        title += " with the tag \"" + this.model.options.attributes.tag_name + "\"";

      if (this.model.options.attributes.q != "")
        title += " with \"" + this.model.options.attributes.q +  "\" found";
      else
        title += " in your account";

      $("section.tables > div.head > h2").text(title);
    },

    _showLoader: function() {
      cdb.log.info("start");
    },

    _hideLoader: function() {
      cdb.log.info("end");
    }
  });

  cdb.admin.dashboard.TableList = TableList;
})();
