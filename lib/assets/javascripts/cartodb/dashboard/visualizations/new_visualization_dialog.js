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
    this.$el.show();
  },

  clear: function() {
    this.$el.hide();
  },

  _onRemove: function(e) {
    this.killEvent(e);
    this.clear();
    this.trigger("remove", this);
  },

  render: function() {
    this.$el.html(this.template(this.model.toJSON()));
    return this.$el;
  }

});

cdb.admin.NewVisualizationDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: _t('Create visualization'),
    description: _t('Select the layers you will use on this visualization (you will be able to add more later)'),
    new_vis_title: _t("Give a name to your visualization")
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
      ok_button_classes: "button green hidden",
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
    this.table_items.bind("remove", this._onRemove, this);

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

  _onReset: function() {

    this.tables.unbind(null, null, this); // do this one time and one time only

    if (this.tableCombo) this.tableCombo.clean();

    this.tableList = this.tables.pluck('name')

    this.table_name = this.tableList[0];

    this._addCombo();

    this._showControls();

  },

  _showControls: function() {
    var self = this;

    this.$el.find(".loader").fadeOut(250, function() {
      $(this).addClass("hidden");

      self.$el.find(".combo_wrapper").fadeIn(250, function() { $(this).removeClass("hidden"); });
      self.$el.find(".ok.button").fadeIn(250, function() { $(this).removeClass("hidden"); });
    });

    this._setupScroll();

  },

  _setupScroll: function() {

    this.$scrollPane = this.$el.find(".scrollpane");
    this.$scrollPane.jScrollPane({ showArrows: true, animateScroll: true, animateDuration: 150 });
    this.api = this.$scrollPane.data('jsp');

  },

  _cleanString: function(s, n) {

    if (s) {
      s = s.replace(/<(?:.|\n)*?>/gm, ''); // strip HTML tags
      s = s.substr(0, n-1) + (s.length > n ? '&hellip;' : ''); // truncate string
    }

    return s;

  },

  _onAddTableItem: function(e) {

    this.killEvent(e);

    var name = this._cleanString(this.table_name, 40);

    if (name) {
      var model = new cdb.admin.NewVisualizationDialogTableModel({ name: name });
      this.table_items.add(model);

    }

  },

  _afterAddItem: function(name) {

    var data = _.without(this.tableCombo.data, name);

    this.tableCombo.updateData(data);
    this.table_name = data[0];

  },

  _afterRemoveItem: function(name) {

    var data = _.union([name], this.tableCombo.data);

    this.tableCombo.updateData(data);
    this.table_name = data[0];

  },

  _addTableItem: function(model) {

    this.enableOkButton();

    this._afterAddItem(model.get("name"));

    var view  = new cdb.admin.NewVisualizationDialogTableItem({ model: model });
    this.$(".tables").prepend(view.render());

    view.bind("remove", this._onRemoveItem, this);
    view.show();

    this._refreshScrollPane();

  },

  _onRemoveItem: function(item) {
    this.table_items.remove(item.model);
    this._refreshScrollPane();
    this._afterRemoveItem(item.model.get("name"));
  },

  _onRemove: function() {
    if (this.table_items.length == 0) this.disableOkButton();
  },

  _refreshScrollPane: function() {

    var self = this;

    this.$(".scrollpane").animate({
      height: this.$(".tables").height() + 5 }, { duration: 150, complete: function() {
        self.api && self.api.reinitialise();
      }});

  },

  _addCombo: function() {

    this.tableCombo = new cdb.forms.Combo({
      el: this.$content.find('.tableListCombo'),
      model: this.tableSelection,
      property: "table",
      width: "309px",
      extra: this.tableList
    });

    this.tableCombo.bind('change', this._onChange, this);
    this.tableCombo.render();

  },

  _onChange: function(table_name) {
    this.table_name = table_name;
  },

  _ok: function(ev) {
    this.killEvent(ev);

    if (this.table_items.length === 0) return;

    this.hide();

    var tables = this.table_items.pluck("name");

    var dlg = new cdb.admin.NameVisualization({
      msg: this._TEXTS.new_vis_title,
      onResponse: function(name) {
        var vis = new cdb.admin.Visualization();
        vis.save({ name: name, tables: tables }).success(function() {
          window.location.href = vis.viewUrl();
        });
      }
    });

    dlg.bind("will_open", function() {
      $("body").css({ overflow: "hidden" });
    }, this);

    dlg.bind("was_removed", function() {
      $("body").css({ overflow: "auto" });
    }, this);

    dlg.appendToBody().open();

  }

});
