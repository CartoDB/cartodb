
/**
*  Tables list
*
*  It will show the user tables in a list
*
*  Usage example:
*
*  var tableList = new cdb.admin.dashboard.TableList({
*    el: this.$('#tablelist'),
*    collection: this.tables,
*    user: this.user   // it needs it to know if the user has limitations or not
*  });
*
*/

cdb.admin.dashboard.TableList = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function() {
    this.collection.bind('add remove reset', this.render, this);
  },

  render: function() {
    this.clearSubViews();
    var self = this;

    this.collection.each(function(table) {
      var table_item = new cdb.admin.dashboard.TableItem({
        model: table
      })
      .bind('remove', function() {
        this.model.destroy();
      });

      self.$el.append(table_item.render().el);

      self.addView(table_item);
    });
  }

});



/**
* Single table item in dashboard tables list
*
* Usage example:
*
*  var li = new cdb.admin.dashboard.TableItem({
*    model: table_model,
*    limitation: !this.options.user.get("private_tables")
*  });
*
*/

cdb.admin.dashboard.TableItem = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click a.delete': '_deleteTable'
  },

  initialize: function() {
    this.template = cdb.templates.getTemplate('dashboard/views/table_list_item');
  },

  render: function() {
    var attrs = this.model.toJSON();
    attrs.table_size = this._bytesToSize(attrs.table_size);

    this.$el.append(this.template(attrs));
    this.$('a.delete').tipsy({ gravity: 's', fade: true });

    return this;
  },

  _deleteTable: function(e) {
    this.killEvent(e);
    this._confirmAndDelete(e);
  },

  /**
  * Show delete confirmation after decides delete a table
  */
  _confirmAndDelete: function(ev) {
    var self = this;
    ev && (ev.preventDefault());

    this.delete_dialog = new cdb.admin.DeleteDialog({
      model: this.model,
      title: "Delete this table",
      ok_title: "Delete this table",
      content: 'You are about to delete this table. Doing so will result in the deletion of this dataset. We recommend you export it before deleting it.',
      config: this.options.config
    });

    $("body").append(this.delete_dialog.render().el);
    this.delete_dialog.open();

    this.delete_dialog.wait()
    .done(this.deleteTable.bind(this))
    .fail(this.cleanDeleteDialog.bind(this));
  },

  cleanDeleteDialog: function() {
    this.delete_dialog.clean();
  },

  deleteTable: function() {
    this.trigger('remove');
  },

  clean: function() {
    // Remove tipsy
    if (this.$("a.delete").data('tipsy')) {
      this.$("a.delete").unbind('mouseenter mouseleave');
      this.$("a.delete").data('tipsy').remove();
    }

    cdb.core.View.prototype.clean.call(this);
  },


  // Help functions
  _bytesToSize: function(by) {
    var bytes = parseInt(by.toString())
    , sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 KB';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    var value = (bytes / Math.pow(1024, i)).toFixed(2);

    if (value % 1 == 0) {
      value = parseInt(value)
    }

    return value + " " + sizes[i];
  }
});
