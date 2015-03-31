/**
* Manage pages in the dashboard tables list
*
* Calculate the pages of the dashboard tables list
* and show them
*
* Usage example:
*
var paginator = new cdb.admin.dashboard.DashboardPaginator({
  el: $("body"),
  items: model.items
});

* It needs a tables model to run correctly.
*/

cdb.admin.DashboardPaginator = cdb.core.View.extend({

  el: "ul",

  _TEXTS: {
    visualizations: {
      locked:   _t('View your <%- total > 1 ? total : "" %> locked <%- type %><%- total !== 1 ? "s" : "" %>'),
      unlocked: _t('View your non locked <%- type %>s')
    }
  },

  events: {
    'click .page': '_pageChange',
    'click .lock': '_onLockClick'
  },

  initialize: function() {
    _.bindAll(this, "_updatePaginator", "_pageChange");

    this.model = new cdb.core.Model({ locked: false });
    this.items = this.options.items;
    this.router = this.options.router;

    this.add_related_model(this.items);
    this._generateLockVis();

    // Bindings
    this.items.bind('reset add remove', this._updatePaginator, this);
  },


  _renderLinks: function() {

    var self = this;

    var pages = [];

    for (var i = this.total_pages, length = 0; length < i; i--) {
      pages.push(i);
    }

    var $li = $("<li>");
    var $link = $("<a href='#' class='paginator_filter'>"+ this.current_page +"</a>");
    this.$ul.append($li.append($link));

    var tag = this.attrs.tags;
    var q   = this.attrs.q;

    var path = '';

    this.dropdown = new cdb.admin.PaginatorDropdown({
      className: 'dropdown paginator border',
      template_base: 'dashboard/views/paginator_dropdown',
      path: path,
      current_page: this.current_page,
      pages: pages,
      vertical_offset: 10,
      vertical_position: "up",
      position: "offset",
      width: 32,
      target: $(".paginator_filter"),
    });

    this.dropdown.bind("onClick", function(e) {
      self._pageChange(e);
    });

    $("body").append(this.dropdown.render().el);
    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

  },

  _renderPrevLink: function() {

    var template = '<li><a href="<%- url %>" class="<%- classes %>"><i></i></a></li>';
    var opts     = { url: "#", classes: "prev button grey page" };

    if (this.current_page - 1 > 0) {

      opts.url = (this.current_page - 1);

    } else {
      opts.classes = opts.classes + " disabled";
    }

    this.$ul.append(_.template(template, opts));

  },

  _renderNextLink: function() {

    var template = '<li><a href="<%- url %>" class="<%- classes %>"><i></i></a></li>';
    var opts     = { url: "#", classes: "next button grey page" };

    if (this.current_page < this.total_pages) {
      opts.url = (this.current_page + 1);
    } else {
      opts.classes = opts.classes + " disabled";
    }

    this.$ul.append(_.template(template, opts));

  },

  _renderFullPagination: function() {

    this.$el.removeClass("view_all");
    this.$el.removeClass("empty");

    this._renderPrevLink();
    this._renderLinks();
    this._renderNextLink();

  },

  render: function() {
    this.clearSubViews();
    this.$el.empty();
    this.$el.removeClass('empty');

    this.attrs         = this.items.options.attributes;
    this.current_page  = parseInt(this.items.options.get("page"), 10);
    this.per_page      = this.items.options.get("per_page");
    this.total_entries = this.items.total_entries;
    this.total_pages   = this.items.getTotalPages();

    // Render?
    if (this.total_entries <= this.per_page && !this.model.get('locked') && !this.router.model.get('locked')) {
      this.$el.addClass("empty");
      return false;
    }

    this.$el.append($('<ul>'));
    this.$ul = this.$("ul");
    this.$locked = $('<p>');
    this.$el.prepend(this.$locked);

    var per_page_count = (this.items.options.get("type") == 'table') ? this.items._PREVIEW_TABLES_PER_PAGE : this.items._PREVIEW_ITEMS_PER_PAGE;

    // Render pagination?
    if (this.total_entries > this.per_page) {
      this._renderFullPagination();
      this.$el.append(this.$ul);
    }

    // Add locked visualizations link?
    if (( this.model.get('locked') || this.router.model.get('locked') )) {
      var inLockView = this.router.model.get('locked');
      var link_text = _.template(this._TEXTS.visualizations[ !inLockView ? 'locked' : 'unlocked' ])({
          total: this.locked_vis_clone.total_entries,
          type: ( this.options.what === "tables" ? 'table' : 'visualization' )
        })
      this.$locked.append("<a class='lock' href='#/locked'>" + link_text + "</a>");
    }

    return this;

  },

  /**
  * Update the dashboard paginator
  */
  _updatePaginator: function() {
    // Don't show lock link from the beginning
    this.model.set('locked', false);

    // We need to check if there are any lock table/visualizations
    if (!this.router.model.get('locked') && this.items.total_entries > 0) {
      this._checkLockTables();
    }

    this.render();
  },

  _checkLockTables: function() {
    var self = this;

    this.locked_vis_clone.fetch({
      success: function(c) {
        if (c.size() > 0) {
          self.model.set('locked', true);
          self.render();
        }
      }
    });
  },

  _generateLockVis: function() {
    // There is no info about how many lock tables user has in this account
    // so we need to make a request to the visualizations endpoint and check
    // if there is any and show the link at the bottom.
    this.locked_vis_clone = new cdb.admin.Visualizations();

    this.locked_vis_clone.options.set(
      _.extend(
        this.items.options.toJSON(),
        {
          locked:         true,
          exclude_shared: true,
          page:           1,
          per_page:       1,
          q:              '',
          tags:           '',
          type:           this.options.what === "tables" ? "table" : "derived"
        }
      )
    );
  },

  _onLockClick: function(e) {
    this.killEvent(e);

    var path = 
      ( this.options.what === "tables" ? 'tables' : 'visualizations' ) +
      ( cdb.config.prefixUrl() !== "" ? '/mine' : '' ) + // In an organization or not?
      ( !this.router.model.get('locked') ? '/locked' : '' );
    
    this.router.navigate(path, { trigger: true });
  },

  _pageChange: function(e) {
    this.killEvent(e);

    this.dropdown.hide();

    var page = $(e.currentTarget).attr('href');

    if (!$(e.currentTarget).hasClass("disabled")) {
      this.trigger('goToPage', page, this);

      // testeability
      if(this.cancelClicks) { this.killEvent(e); }
    }
  }

});
