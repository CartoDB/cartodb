
/**
 * dialog shown when a new column
 */
cdb.admin.NewColumnDialog= cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: 'Add new Column',
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Create column",
      modal_type: "creation",
      width: 335,
      modal_class: 'new_column_dialog'
    });
    this.constructor.__super__.initialize.apply(this);
    this.columnType = new Backbone.Model({
      columnType: 'string'
    });
  },

  render_content: function() {
    this.$('.content').append(this.getTemplate('table/views/new_column_dialog')());
    this.combo = new cdb.forms.Combo({
      el: this.$('.column_select'),
      model: this.columnType,
      property: 'columnType',
      extra: ['string', 'number', 'date']
    });
    this.addView(this.combo);
    this.$('column_select').append(this.combo.render().el);
    return '';
  },

  // validate
  checkColumnName: function() {
    var s = this.$('input').val();
    if(s.trim() === '') {
      return false;
    }
    return true;
  },

  // create the column here
  ok: function() {
    if(this.checkColumnName()) {
      this.options.table.addColumn(
        this.$('input').val(), 
        this.columnType.get('columnType')
      );
    }
  }

});
