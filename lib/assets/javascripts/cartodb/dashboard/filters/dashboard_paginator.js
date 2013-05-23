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

  _generateLink: function(i) {

    var page = i + 1
    , $a = $("<a>").text(page)
    , link = ''
    , _class = (page == this.current_page) ? "selected" : "" ;

    // Check if the app is searching a query or a tag
    if (this.attrs.tag_name != "") {
      link = "#/tag/" + this.attrs.tag_name + "/" + page
    } else if (this.attrs.q != "") {
      link = "#/search/" + this.attrs.q + "/" + page
    } else {
      _class = _class + " page button grey"
      link = page;
    }

    return $a.addClass(_class).attr("href", link).html(link);

  },

  _renderLinks: function() {

    var $li = $("<li>");

    for (var i = 0, length = this.total_pages; i < length; i++) {
      var $link = this._generateLink(i);
      this.$ul.append($li.append($link));
    }

  },

  _renderPrevLink: function() {
    if (this.current_page - 1 > 0) this.$ul.append('<li><a href="' + (this.current_page - 1)+ '" class="prev button grey page"><i></i></a></li>');
    else this.$ul.append('<li><a href="#" class="prev button grey page disabled"><i></i></a></li>')
  },

  _renderNextLink: function() {
    if (this.current_page < this.total_pages) this.$ul.append('<li><a href="' + (this.current_page + 1)+ '" class="next button grey page"><i></i></a></li>');
    else this.$ul.append('<li><a href="#" class="next button grey page disabled"><i></i></a></li>')
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
    this.per_page      = this.items.options.get("per_page")
    this.total_entries = this.items.total_entries;
    this.total_pages   = this.items.getTotalPages();

    if (this.total_entries <= this.per_page) {
      this.$el.addClass("empty");
    }
    else if (this.per_page == this.items._PREVIEW_ITEMS_PER_PAGE) this._renderViewAllPagination();
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

    var page = $(e.currentTarget).attr('href')

    if (!$(e.currentTarget).hasClass("disabled")) {
      this.trigger('loadingPage', page, this);

      // testeability
      if(this.cancelClicks) { this.killEvent(e); }
    }
  }

});
