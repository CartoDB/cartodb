
/**
 * Delete confirmation window (extends Dialog)
 *
 * When you need to delete a table, it needs a confirmation
 *
 * Usage example:
 *
    var delete_dialog = new cdb.admin.DeleteDialog({
      model: table_model,
      user:  user_model
    });
 *
 */

cdb.admin.DeleteDialogItemsCollection = Backbone.Collection.extend({
  model: "DeleteDialogItem"
});

cdb.admin.DeleteDialogItemModel = cdb.core.Model.extend({

  defaults: {
    open: false
  }

});

cdb.admin.DeleteDialogItem = cdb.core.View.extend({

  events: {

    "click .open": "_onClick"

  },

  initialize: function() {

    var msg;

    _.bindAll(this, "_toggle");

    this.model.bind("change:open", this._onToggle, this);

    this.template = cdb.templates.getTemplate('old_common/views/delete_dialog_item');
  },

  _onToggle: function() {

    if (this.model.get("open")) {
      this.$el.addClass("open");
    } else {
      this.$el.removeClass("open");
    }

  },

  _onClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this._toggle();
  },

  _toggle: function() {

    this.model.set("open", !this.model.get("open"));

  },

  render: function() {
    var self = this;
    var visualization_list = _.map(this.model.get("visualizations"), function(vis) {
      var ownership = '';
      
      if (self.options.user.isInsideOrg()) {
        var vis_owner = vis.permission.owner;
        var ownership = (vis.permission.owner.username !== self.options.user.get('username')) ?
          ( ' (Created by ' + vis.permission.owner.username + ')' ) :
          '';
      }

      return '<a href="' + cdb.config.prefixUrl() + '/viz/' + vis.id + '">' + vis.name + ownership +'</a>';
    }).join(", ").replace(/,\s([^,]+)$/, ' and $1');

    var content = _.extend(this.model.toJSON(), { visualization_list: visualization_list  });
    var template = this.template(content);

    this.$el.html(template);

    return this.$el;
  }

});

cdb.admin.DeleteDialog = cdb.admin.BaseDialog.extend({

  events: function(){
    return _.extend({},cdb.admin.BaseDialog.prototype.events,{
      'click .export':             '_showExport',
      'click .modal.export nav a':  'hide'
    });
  },

  _TEXTS: {
    title: _t("Delete this dataset"),
    default_message: _t("You are about to delete this dataset. Doing so will result in the deletion of this layer."),
    delete_vis_message: _t("You are about to delete this dataset. Doing so will result in the deletion of this layer. Also, deleting this layer will affect the following maps."),
    cancel_title: _t("Export my data first"),
    ok_title: _t("Ok, delete")
  },

  initialize: function() {

    _.bindAll(this, 'ok', "_showVisualizations");

    this.options = _.extend({
      title: this._TEXTS.title,
      content: this._TEXTS.default_message,
      template_name: 'old_common/views/delete_dialog_base',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.ok_title,
      cancel_button_classes: "underline margin15 export",
      cancel_title: this._TEXTS.cancel_title,
      modal_type: "confirmation",
      width: 574,
      modal_class: 'delete_table_dialog'
    }, this.options);

    this.elder('initialize');

  },

  render_content: function() {

    this.$el.find(".loader").fadeIn(250);

    this.model.fetch({
      wait: true,
      success: this._showVisualizations,
      error: function(m) {
        // TODO: Handle error
      }
    });

    return this.getTemplate('old_common/views/delete_table_dialog')(this.options);

  },

  _addItem: function(model) {

    var item = new cdb.admin.DeleteDialogItem({
      className: model.get("type"),
      model: model,
      user: this.options.user
    });

    this.$el.find(".content").append(item.render());

  },

  _showVisualizations: function() {
    var self = this;

    var onLoaderHidden = function() {

      var id            = self.model.get("table_visualization").id;
      var dependent     = _.filter(self.model.get("dependent_visualizations"), function(v) { if (v.id != id) return v; });
      var non_dependent = self.model.get("non_dependent_visualizations");

      if (dependent.length > 0 || non_dependent.length > 0) {
        self.$el.find(".content p").html(self._TEXTS.delete_vis_message);
      }

      self.items = new cdb.admin.DeleteDialogItemsCollection();
      self.items.bind("add", self._addItem, self);

      if (non_dependent && non_dependent.length > 0) {
        var item = new cdb.admin.DeleteDialogItemModel({ type: "non_dependent", visualizations: non_dependent });
        self.items.add(item);
      }

      if (dependent && dependent.length > 0) {
        var item = new cdb.admin.DeleteDialogItemModel({ type: "dependent", visualizations: dependent });
        self.items.add(item);
      }

      self.$el.find(".content").fadeIn(250);
      self.$el.find(".foot").fadeIn(250);

    };

    this.$el.find(".loader").fadeOut(250, onLoaderHidden);

  },

  /**
   * Show the export window
   */
  _showExport: function(ev) {

    ev.preventDefault();

    var self = this;

    var export_dialog = new cdb.admin.ExportTableDialog({
      model: this.model,
      config: window.config, // BAD! We should pass this as init param!
      user_data: this.options.user.toJSON(),
      autoClose: true
    });

    $("body").append(export_dialog.render().el);

    export_dialog.open();

    self.hide();

    var clean_on_hide = this.options.clean_on_hide;

    this.options.clean_on_hide = false;

    export_dialog.bind('generating', function(text) {
      self.$('p').html(text);
      self.open();
      this.options.clean_on_hide = clean_on_hide;
    });

  },

  _ok: function(ev) {

   if (ev) ev.preventDefault();

    if (this.ok) {
      this.ok();
    }

    this.hide();

  },

  /**
   * Returns a promise to allow parent to continue when user clicks button
   * @return {Promise}
   */
  wait: function() {
    this.dfd = $.Deferred();
    return this.dfd.promise();
  },

  ok: function(ev) {
    this.killEvent(ev);
    this.dfd.resolve();
  }

});
