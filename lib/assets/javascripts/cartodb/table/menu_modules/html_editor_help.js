  
  /**
   *  Help message for html editor panes
   *  
   */

  cdb.admin.mod.HTMLEditorHelp = cdb.core.View.extend({

    _TEXTS: {
      message: _t("To link data write your column names within {{}}")
    },

    className: "help-tip",

    events: {
      'click .close': '_onClickClose'
    },

    initialize: function() {
      this.template = this.getTemplate("table/views/html_editor_help");

      if (this.options.text) {
        this._TEXTS.message = this.options.text;
      }

      this._setupLocalStorage();
      this._setupModel();
      this._toggle();

      _.bindAll(this, "_show", "_hide");
    },

    render: function() {
      this.clearSubViews();

      var content = this.template(this.model.toJSON());
      this.$el.html(content);

      return this;
    },

    _setupLocalStorage: function() {
      var key      = this.options.localStorageKey || 'html_editor_help';
      this.storage = new cdb.admin.localStorage(key);
    },

    _setupModel: function() {

      var hidden = this.storage.get('hidden') === true ? true : false;

      this.model = new cdb.core.Model({ hidden: hidden, message: this._TEXTS.message });
      this.model.bind("change:message", this.render, this);
      this.model.bind("change:hidden", this._toggle, this);
    },

    _show: function() {
      this.show();
      this.trigger("show", this);
    },

    _hide: function() {
      this.hide();
      this.trigger("hide", this);
    },

    _onClickClose: function(e) {
      this.killEvent(e);
      this.storage.set({
        hidden: true
      });
      this.model.set("hidden", true);
    },

    _toggle: function() {
      if (this.model.get("hidden")) this._hide();
      else this._show();
    }

  });
