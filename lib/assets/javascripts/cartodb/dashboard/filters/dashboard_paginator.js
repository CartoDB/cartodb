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

  events: {
    'click .page':     'pageChange',
    'click .view_all': 'viewAll'
  },

  initialize: function() {
    _.bindAll(this, "_updatePaginator", "pageChange", "viewAll");

    this.model = new cdb.core.Model();
    this.items = this.options.items;

    this.add_related_model(this.items);

    // Bindings
    this.items.bind('reset add remove', this._updatePaginator, this);
    this.model.bind('change:visible', this._toggleVisibility, this);

  },

  _generatePath: function() {

    var tag = this.attrs.tags;
    var q   = this.attrs.q;

    // Check if the app is searching a query or a tag
    if (tag) {

      path = "/" + this.options.what + "/tag/" + tag;

    } else if (q) {

      path = "/" + this.options.what +"/search/" + q;

    } else {
      path  = "/" + this.options.what;
    }
    return path;

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

    var path = this._generatePath();

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
      self.pageChange(e);
    });

    $("body").append(this.dropdown.render().el);
    cdb.god.bind("closeDialogs", this.dropdown.hide, this.dropdown);

  },

  _renderPrevLink: function() {

    var template = '<li><a href="<%= url %>" class="<%= classes %>"><i></i></a></li>';
    var opts     = { url: "#", classes: "prev button grey page" };

    if (this.current_page - 1 > 0) {

      opts.url = this._generatePath() + "/" + (this.current_page - 1);

    } else {
      opts.classes = opts.classes + " disabled";
    }

    this.$ul.append(_.template(template, opts));

  },

  _renderNextLink: function() {

    var template = '<li><a href="<%= url %>" class="<%= classes %>"><i></i></a></li>';
    var opts     = { url: "#", classes: "next button grey page" };

    if (this.current_page < this.total_pages) {
      opts.url = this._generatePath() + "/" + (this.current_page + 1);
    } else {
      opts.classes = opts.classes + " disabled";
    }

    this.$ul.append(_.template(template, opts));

  },

  _renderViewAllPagination: function() {
    this.$el.addClass("view_all");
    this.$el.removeClass("empty");

    this.$ul.append('<li><a href="" class="view_all">View all ' + this.options.what + '</a></li>')
  },

  _renderFullPagination: function() {

    this.$el.removeClass("view_all");
    this.$el.removeClass("empty");

    this._renderPrevLink();
    this._renderLinks();
    this._renderNextLink();

  },

  render: function() {

    this.$el.html("");
    this.$el.append("<ul></ul");
    this.$ul = this.$el.find("ul");

    this.attrs         = this.items.options.attributes;
    this.current_page  = parseInt(this.items.options.get("page"), 10);
    this.per_page      = this.items.options.get("per_page");
    this.total_entries = this.items.total_entries;
    this.total_pages   = this.items.getTotalPages();

    var per_page_count = (this.items.options.get("type") == 'table') ? this.items._PREVIEW_TABLES_PER_PAGE : this.items._PREVIEW_ITEMS_PER_PAGE;

    if (this.total_entries <= this.per_page) {
      this.$el.addClass("empty");
    }
    else if (this.per_page == per_page_count) this._renderViewAllPagination();
    else this._renderFullPagination();

    this.$el.append(this.$ul);

    return this;

  },

  _toggleVisibility: function() {
    if (this.model.get("visible")) this._show();
    else this._hide();
  },

  _show: function() {
    this.$el.css("opacity", 1);
    this.$el.fadeIn(250);
  },

  _hide: function() {
    this.$el.fadeOut(250, function() {
      $(this).css("opacity", 0);
    });
  },

  /**
  * Update the dashboard paginator
  */
  _updatePaginator: function() {
    this.render();
  },

  viewAll: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.trigger('viewAll', this);
  },

  pageChange: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.dropdown.hide();

    var page = $(e.currentTarget).attr('href')

    if (!$(e.currentTarget).hasClass("disabled")) {
      this.trigger('goToPage', page, this);

      // testeability
      if(this.cancelClicks) { this.killEvent(e); }
    }
  }

});
