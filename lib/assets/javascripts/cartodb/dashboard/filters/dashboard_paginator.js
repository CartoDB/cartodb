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

  render: function() {

    this.$el.html("");
    this.$el.append("<ul></ul");
    this.$ul = this.$el.find("ul");

    var attrs          = this.items.options.attributes;
    this.current_page  = parseInt(this.items.options.get("page"), 10)
    this.per_page      = this.items.options.get("per_page")
    this.total_entries = this.items.options.get("total_entries")
    this.total_pages   = this.items.getTotalPages();

    if (this.per_page < this.items._ITEMS_PER_PAGE) {

      this.$ul.append('<li><a href="" class="view_all">View all ' + this.options.what + '</a></li>')

    } else {

      if (this.current_page - 1 > 0) this.$ul.append('<li><a href="' + (this.current_page - 1)+ '" class="prev button grey page"><i></i></a></li>');
      else this.$ul.append('<li><a href="#" class="prev button grey page disabled"><i></i></a></li>')

      for (var i = 0, length = this.total_pages; i < length; i++) {
        var page = i + 1
        , $a = $("<a>").text(page)
        , $li = $("<li>")
        , link = ''
        , _class = (page == this.current_page) ? "selected" : "" ;

        // Check if the app is searching a query or a tag
        if (attrs.tag_name != "") {
          link = "#/tag/" + attrs.tag_name + "/" + page
        } else if (attrs.q != "") {
          link = "#/search/" + attrs.q + "/" + page
        } else {
          _class = _class + " page button grey"
          link = page;
        }

        // Add class and link
        $a
        .addClass(_class)
        .attr("href", link)
        .html(link)

        this.$ul.append($li.append($a));
      }

      if (this.current_page < this.total_pages) this.$ul.append('<li><a href="' + (this.current_page + 1)+ '" class="next button grey page"><i></i></a></li>');
      else this.$ul.append('<li><a href="#" class="next button grey page disabled"><i></i></a></li>')

    }

    this.$el.append(this.$ul);

    // Positionate it
    var w = this.$ul.outerWidth();
    this.$ul.css({ "margin-left": "-" + (w/2) + "px" })

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
