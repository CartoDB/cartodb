/**
 *  Dialog to add a new layer from any of your
 *  existing tables.
 *
 */

cdb.admin.NewLayerDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: _t('Add Layer'),
    description: _t('You can import data to this map or add one of your existing tables.')
  },

  // do not remove
  events: cdb.core.View.extendEvents({}),

  initialize: function() {
    // dialog options
    _.extend(this.options, {
      title: this._TEXTS.title,
      description: this._TEXTS.description,
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.title,
      modal_type: "creation",
      modal_class: 'new_layer_dialog',
      width: 572
    });
    this.ok = this.options.ok;

    this.tableSelection = new cdb.core.Model();
    this.constructor.__super__.initialize.apply(this);
    this.setWizard(this.options.wizard_option);
    this.tables = new cdb.admin.Tables();
  },

  render_content: function() {
    this.$content = $("<div>");
    var temp_content = this.getTemplate('table/views/new_layer_dialog');

    this.$content.append(temp_content({}));

    this.tables.fetch()
    this.tables.bind('reset', this._onReset, this)
    this.disableOkButton();

    return this.$content;
  },

  _onReset: function() {

    this.tables.unbind(null, null, this);

    if (this.tableCombo) this.tableCombo.clean();

    var tableList = this.tables.pluck('name')
    this.result = tableList[0];
    this.enableOkButton();

    this.tableCombo = new cdb.forms.Combo({
      el: this.$content.find('.tableListCombo'),
      model: this.tableSelection,
      property: "table",
      width: '468px',
      extra: tableList
    });

    this.tableCombo.bind('change', function(table){ this.result = table; }, this)
    this.tableCombo.render();

  }
});
