/**
*  Dialog to add a new visualization from any of your
*  existing tables.
*
*/
cdb.admin.NewVisualizationDialogTableModel = cdb.core.Model.extend({
  defaults: {
    name: "Table name"
  }
});

cdb.admin.NewVisualizationDialogTableCollection = Backbone.Collection.extend({
  model: "NewVisualizationDialogTableModel"
});

cdb.admin.NewVisualizationDialogTableItem = cdb.core.View.extend({

  events: {
    "click .remove" : "_onRemove"
  },

  tagName: "li",
  className: "table",

  initialize: function() {

    _.bindAll(this, "_onRemove");

    this.template = this.getTemplate('dashboard/views/new_visualization_dialog_table_item');
  },

  show: function() {
    this.$el.slideDown(150);
  },

  clear: function() {

    this.$el.slideUp(150, function() {
      this.remove();
    });

  },

  _onRemove: function(e) {

    this.killEvent(e);

    this.clear();
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this.$el;
  }

});

cdb.admin.NewVisualizationDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: _t('Create visualization'),
    description: _t('Select the layers you will use on this visualization (you will be able to add more later)')
  },

  events: cdb.core.View.extendEvents({ // do not remove
    "click .add" : "_onAddTableItem",
  }),

  initialize: function() {

    // Dialog options
    _.extend(this.options, {
      title: this._TEXTS.title,
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button green",
      ok_title: this._TEXTS.title,
      modal_type: "creation",
      modal_class: 'new_visualization_dialog',
      width: 464
    });

    this.ok = this.options.ok;

    this.tableSelection = new cdb.core.Model();

    // Collection to manage the tables
    this.table_items = new cdb.admin.NewVisualizationDialogTableCollection();
    this.table_items.bind("add", this._addTableItem, this);

    this.constructor.__super__.initialize.apply(this);
    this.setWizard(this.options.wizard_option);
    this.tables = new cdb.admin.Tables();

  },

  render_content: function() {

    this.$content = $("<div>");

    var temp_content = this.getTemplate('dashboard/views/new_visualization_dialog');

    this.$content.append(temp_content({ description: this._TEXTS.description }));

    this.tables.fetch()
    this.tables.bind('reset', this._onReset, this)

    this.disableOkButton();

    return this.$content;
  },

  _onAddTableItem: function(e) {

    this.killEvent(e);

    var model = new cdb.admin.NewVisualizationDialogTableModel({ name: this.table_name });
    this.table_items.add(model);
  },

  _addTableItem: function(model) {

    var view  = new cdb.admin.NewVisualizationDialogTableItem({ model: model });
    this.$(".tables").append(view.render());
    view.show();
  },

  _onRemoveItem: function(model) {
    this.table_items.remove(model);
  },

  _onReset: function() {

    this.tables.unbind(null, null, this); // do this one time and one time only

    if (this.tableCombo) this.tableCombo.clean();

    this.tableList = this.tables.pluck('name')

    this.table_name = this.tableList[0];
    this.enableOkButton();

    this._addCombo();

  },

  _addCombo: function() {

    this.tableCombo = new cdb.forms.Combo({
      el: this.$content.find('.tableListCombo'),
      model: this.tableSelection,
      property: "table",
      width: "309px",
      extra: this.tableList
    })

    this.tableCombo.bind('change', this._onChange, this);
    this.tableCombo.render();

  },

  _onChange: function(table_name) {
    this.table_name = table_name;
  },

  _ok: function(ev) {
    this.killEvent(ev);
  }

});
