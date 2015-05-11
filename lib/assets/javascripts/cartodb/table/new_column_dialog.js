
/**
 * Dialog shown when a new column
 */
cdb.admin.NewColumnDialog= cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: 'Add new column',
      description: '',
      template_name: 'old_common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Create column",
      modal_type: "creation",
      width: 335,
      modal_class: 'new_column_dialog',
      error_messages: {
        empty: "You have to choose a name"
      }
    });
    this.constructor.__super__.initialize.apply(this);
    this.columnType = new cdb.core.Model({
      columnType: 'string'
    });

    _.bindAll(this, "_checkInput");

    // After clean... remove new bindings
    this.bind("clean", this._reClean);
  },

  render_content: function() {
    this.$('.content').append(this.getTemplate('table/views/new_column_dialog')());
    this.combo = new cdb.forms.Combo({
      el: this.$('.column_select'),
      model: this.columnType,
      property: 'columnType',
      width: '100%',
      extra: ['string', 'number', 'date', 'boolean']
    });

    this.addView(this.combo);
    this.$('column_select').append(this.combo.render().el);

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

    if(this.checkColumnName()) {
      this.options.table.addColumn(
        this.$('input.column_name').val(),
        this.columnType.get('columnType')
      );
    } else {
      this._showError();
      return false;
    }

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
