
/**
 *  Public header, dance starts!
 *
 */

cdb.open.Header = cdb.core.View.extend({

  _TEXTS: {
    duplicate_table: {
      title:   _t('Name for your copy of this <%- type %>'),
    }
  },

  events: {
    'click .clone': '_onClickClone'
  },

  initialize: function() {
    this.vis = this.options.vis;
    this.template = cdb.templates.getTemplate('public/views/public_header');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.template(
        _.defaults({
          vis_url: this.vis && this.vis.viewUrl() || '',
          isMobileDevice: this.options.isMobileDevice,
          owner_username: this.options.owner_username,
          current_view: this.options.current_view
        }, this.model.attributes)
      )
    );
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.model.bind('change', this.render, this);
  },

  _initViews: function() {

    if (this.$('.account').length > 0) {
      var dropdown = new cdb.open.AccountDropdown({
        target: this.$('a.account'),
        model: this.model,
        vertical_offset: 20,
        width: 166
      });

      this.addView(dropdown);
      cdb.god.bind("closeDialogs", dropdown.hide, dropdown);
      this.add_related_model(cdb.god);
      $('body').append(dropdown.render().el);
    }
  },

  _onClickClone: function(e) {
    // Not logged, no clone!
    if (this.model.get('username')) {
      if (e) this.killEvent(e);

      var dlg;
      
      if (this.options.current_view === "visualization") {
        dlg = new cdb.admin.DuplicateVisDialog({
          model: this.vis,
          title: _.template(this._TEXTS.duplicate_table.title)({ type: this.options.current_view })
        });
      } else {
        dlg = new cdb.admin.DuplicateTableDialog({
          model: this.vis,
          title: _.template(this._TEXTS.duplicate_table.title)({ type: this.options.current_view })
        });
      }

      dlg
        .appendToBody()
        .open();
    }
  }

});