  
  /**
   *  Help message for infowindow panes
   *  
   */

  cdb.admin.mod.InfowindowHelp = cdb.core.View.extend({

    className: "help",

    events: {
      'click .close': '_onClickClose'
    },

    initialize: function() {
      this.template = this.getTemplate("table/views/infowindows/infowindow_help");

      this._setupLocalStorage();
      this._setupModel();

      _.bindAll(this, "_show", "_hide");
    },

    render: function() {
      this.clearSubViews();

      var content = this.template(this.model.toJSON());
      this.$el.html(content);

      return this;
    },

    _setupLocalStorage: function() {
      var key      = this.options.localStorageKey || 'infowindow_help';
      this.storage = new cdb.admin.localStorage(key);
    },

    _setupModel: function() {
      this.model = new cdb.core.Model({ hidden: true, message: "To link data write your column names within {{}}" });
      this.add_related_model(this.model);

      this.model.bind("change:message", this._onChangeMessage, this);
      this.model.bind("change:hidden", this._onToggle, this);
    },

    _show: function() {
      if (!this.storage.get("hidden")) {
        this.$el.show();
        this.trigger("show", this);
      }
    },

    _hide: function() {
      this.$el.hide();

      this.storage.set({ "hidden": true });
      this.trigger("hide", this);
    },

    _onClickClose: function(e) {
      this.killEvent(e);
      this.model.set("hidden", true);
    },

    _onToggle: function() {
      if (this.model.get("hidden")) this._hide();
      else this._show();
    },

    _onChangeMessage: function() {
      this.$el.find(".help p").html(this.model.get("message"));
    }

  });