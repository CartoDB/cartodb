
/**
 * view for dropdown show when user click on row options
 */
cdb.admin.RowHeaderDropdown = cdb.admin.DropdownMenu.extend({

  className: 'dropdown border',

  events: {
    'click .delete_row': 'deleteRow',
    'click .add_row': 'addRow'
  },

  initialize: function(options) {
    this.tableData = options.tableData;
    this.table = this.options.table;
    this.elder('initialize');
  },

  openAt: function(x, y) {
    this.$el.removeClass('vertical_top vertical_bottom horizontal_right horigonzal_left tick_top tick_bottom');
    this.constructor.__super__.openAt.apply(this, arguments);
  },

  // New show function
  show: function() {
    var dfd = $.Deferred();
    var self = this;
    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();

    this.$el
      .css({
        marginTop: self.options.vertical_position == "down" ? "-1px" : "-50px",
        marginLeft: -5,
        opacity:0,
        display:"block"
      })
      .animate({
        marginLeft: 5,
        opacity: 1
      }, {
        "duration": this.options.speedIn,
        "complete": function(){
          dfd.resolve();
        }
      });
    this.trigger("onDropdownShown",this.el);

    return dfd.promise();
  },

  hide: function(done) {

    // don't attempt to hide the dropdown if it's already hidden
    if (!this.isOpen) { done && done(); return; }

    var self    = this;
    this.isOpen = false;

    this.$el.animate({

      marginLeft: 15,
      opacity: 0

    }, this.options.speedOut, function(){

      // Remove selected class
      $(self.options.target).removeClass("selected");

      // And hide it
      self.$el.hide();
      done && done();

    });

    this.trigger("onDropdownHidden",this.el);

  },

  setRow: function(row) {
    this.row = row;
  },

  deleteRow: function(e) {
    var self = this;
    this.killEvent(e);

    var delete_confirmation = new cdb.admin.BaseDialog({
      title: "Delete this row",
      description: "Are you sure you want to delete this row and all its associated data?",
      template_name: 'old_common/views/confirm_dialog',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "right button grey",
      ok_title: "Yes, do it",
      cancel_button_classes: "underline margin15",
      cancel_title: "Cancel",
      modal_type: "confirmation",
      width: 500
    });

    // If user confirms, app removes the row
    delete_confirmation.ok = function() {
      self.table.trigger('removing:row');
      self.row.destroy({
        success: function() {
          self.table.trigger('remove:row', self.row);
        }
      });
    }

    delete_confirmation
      .appendToBody()
      .open();
    
    this.hide();

    return false;
  },

  addRow: function(e) {
    this.killEvent(e);
    var rowIndex = this.row.collection.indexOf(this.row);

    this.tableData.addRow({ at: rowIndex + 1 });
    this.hide();
    return false;
  }
});
