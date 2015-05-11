

/**
 * Dialog shown when a new column
 */
cdb.admin.FilterColumnDialog = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: 'Filter by column',
      description: '',
      template_name: 'old_common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Filter",
      modal_type: "creation",
      width: 335,
      modal_class: 'filter_column_dialog',
      error_messages: {
        empty: "Can't be empty!"
      }
    });
    this.constructor.__super__.initialize.apply(this);

    _.bindAll(this, "_checkInput");

    // After clean... remove new bindings
    this.bind("clean", this._reClean);
  },

  render_content: function() {
    this.$('.content').append(this.getTemplate('table/views/filter_column_dialog')());

    // When input change
    var $input = this.$el.find('input.column_name');
    $input.bind("keydown",  this._checkInput)

    // Hack to focus in the input
    setTimeout(function(){
      $input.focus()
    },0)

    return this;
  },


  // validate
  checkColumnName: function() {
    var s = this.$('input.column_name').val();
    if(s.trim() === '') {
      return false;
    }
    return true;
  },

  // create the column here
  _ok: function(ev) {
    if(ev) ev.preventDefault();
    /*
    this.options.sqlView.filterColumn(
      this.options.column,
      this.options.table.get('name'),
      this.$('input.column_name').val()
    );
    this.options.table.useSQLView(this.options.sqlView);
    this.options.sqlView.fetch();
    */
    this.options.ok && this.options.ok(this.$('input.column_name').val());
    this.hide();
  },

  // Show the error
  _checkInput: function(ev) {
    var code = (ev.keyCode ? ev.keyCode : ev.which);
    if(code != 13) {
      this._hideError();
    } else {
      this._ok();
    }
  },

  // Show the error
  _showError: function() {
    this.$el.find(".info")
      .addClass("active error")
      .html("<p>" + this.options.error_messages.empty + "</p>");
  },

  // Show the error
  _hideError: function() {
    this.$el.find(".info")
      .removeClass("active");
  },

  // Re-clean more bindings
  _reClean: function() {
    this.$el.find('input.column_name').unbind("keydown");
  }

});
