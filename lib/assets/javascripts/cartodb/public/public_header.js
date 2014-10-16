
/**
 *  Public header, dance starts!
 *
 */

cdb.open.Header = cdb.core.View.extend({

  _TEMPLATE: "<div class='inner'>\
      <h1><a href='<% if (!username) { %>http://www.cartodb.com<% } else { %><%= urls[0] %><% } %>' class='logo' id='the_logo'>CartoDB</a></h1>\
      <ul class='options'>\
        \
        <% if (!username) { %>\
          <li><a href='http://cartodb.com/gallery' class='gallery'>gallery</a></li>\
        <% } %>\
        \
        <% if (!can_fork && !username) { %>\
          <li><a href='http://cartodb.com/login' class='clone'>Clone this</a></li>\
        <% } %>\
        \
        <% if (!username) { %>\
          <li><a class='signup' href='http://cartodb.com/signup'>Sign up</a><li>\
          <li><a href='http://cartodb.com/login' class='border login'>Login</a></li>\
        <% } else { %>\
          \
          <% if (can_fork && current_view !== 'dashboard') { %>\
            <% if (owner_username !== username) { %>\
              <li><a class='editor clone' href='#/'>clone this <%= current_view %></a></li>\
            <% } else { %>\
              <li><a class='editor clone' href='#/'>edit your <%= current_view %></a></li>\
            <% } %>\
          <% } %>\
          \
          <li> \
            <a class='editor dropdown account' href='<%= urls[0] %>'>\
              <% if (avatar_url) { %><img src='<%= avatar_url %>' width='18' title='<%= username %>' alt='<%= username %>' /><% } %><%= username %><span class='separator'></span>\
            </a>\
          </li>\
        <% } %>\
      </ul>\
    </div>\
  ",

  events: {
    'click .clone': '_onClickClone'
  },

  initialize: function() {
    this.vis = this.options.vis;
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      _.template(this._TEMPLATE)(
        _.defaults({
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
    if (e) this.killEvent(e);

    var dlg;
    
    if (this.options.current_view === "visualization") {
      dlg = new cdb.admin.DuplicateVisDialog({
        model: this.vis,
        title: this.vis.get('name')
      });
    } else {

    }

    dlg
      .appendToBody()
      .open();
  }

});