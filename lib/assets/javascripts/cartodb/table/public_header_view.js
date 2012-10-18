
/**
 * header cell view, manages operations on table columns
 */

(function() {

HeaderView = cdb.open.PublicHeaderView = cdb.admin.HeaderView.extend({

  events: {

  },

  initialize: function() {
    var self = this;
    this.column = this.options.column;
    this.table = this.options.table;
    this.template = this.getTemplate('table/views/public_table_header_view');
    this.editing_name = false;
    this.changing_type = false;


  },

  render: function() {
    this.$el.html('');
    window.a = this.column

    this.$el.append(this.template({
      col_name: this.column[0],
      col_type: this.column[1],
      editing_name: this.editing_name,
    }));

    // Focus in the input if it is being edited
    if (this.editing_name) {
      this.$el.find("input").focus();
    }

    this.delegateEvents();

    return this;
  },

  _openColOptions: function(e) {},

  _openColTypeOptions: function(e) {},

  _checkEditColnameInput: function(e) {},

  _submitEdit: function() {},

  _finishEdit: function() {},

  _renameColumn: function() {},

  _changeType: function() {},

  showColumnOptions: function(e) {},


  showColumnTypeOptions: function(e) {}

});

})();
