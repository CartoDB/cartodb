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
tables: model.tables*
});

* It needs a tables model to run correctly.
*/

cdb.admin.VisualizationPaginator = cdb.core.View.extend({
  events: {
    'click .page': 'pageChange',
    'click .view_all':  'viewAll'
  },

  initialize: function() {
    _.bindAll(this, "_updatePaginator", "pageChange", "viewAll");

    this.model  = new cdb.core.Model();
    this.tables = this.options.tables;

    this.add_related_model(this.tables);

    // Bindings
    this.tables.bind('reset add remove', this._updatePaginator, this);
    this.model.bind('change:visible', this._toggleVisibility, this);

  },

  render: function() {

    this.$el.html("");

    var attrs       = this.tables.options.attributes
    , current_page  = parseInt(this.tables.options.get("page"), 10)
    , per_page      = this.tables.options.get("per_page")
    , total_pages   = this.tables.getTotalPages()
    , $ul           = $("<ul>");

    if (per_page == 3) {

      $ul.append('<li><a href="" class="view_all">View all visualizations</a></li>')

    } else {

      console.log("current_page", this.tables.options, current_page, total_pages);

      if (current_page - 1 > 0) $ul.append('<li><a href="' + (current_page - 1)+ '" class="prev button grey page"><i></i></a></li>');
      else $ul.append('<li><a href="#" class="prev button grey page disabled"><i></i></a></li>')

      for (var i = 0, length = total_pages; i < length; i++) {
        var page = i + 1
        , $a = $("<a>").text(page)
        , $li = $("<li>")
        , link = ''
        , _class = (page == current_page) ? "selected" : "" ;

        // Check if the app is searching a query or a tag
        if (attrs.tag_name != "") {
          link = "#/tag/" + attrs.tag_name + "/" + page
        } else if (attrs.q != "") {
          link = "#/search/" + attrs.q + "/" + page
        } else {
          _class = _class + " page button grey"
          link = page;
        }

        console.log("link", link);

        // Add class and link
        $a
        .addClass(_class)
        .attr("href", link)
        .html(link)

        $ul.append($li.append($a));
      }

      if (current_page < total_pages) $ul.append('<li><a href="' + (current_page + 1)+ '" class="next button grey page"><i></i></a></li>');
      else $ul.append('<li><a href="#" class="next button grey page disabled"><i></i></a></li>')

    }

    this.$el.append($ul);

    // Positionate it
    var w = $ul.outerWidth();
    $ul.css({ "margin-left": "-" + (w/2) + "px" })

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
