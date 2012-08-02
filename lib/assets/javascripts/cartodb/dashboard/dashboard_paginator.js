

(function() {

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
        model: model.tables*
      });

      * It needs a tables model to run correctly.
  */

  var DashboardPaginator = cdb.core.View.extend({

    initialize: function() {
      _.bindAll(this, "_updatePaginator");

      this.model.bind('reset add remove', this._updatePaginator, this);
    },

    render: function() {

      this.$el.html("");

      var attrs         = this.model.options.attributes
        , current_page  = this.model.options.get("page")
        , total_pages   = this.model.getTotalPages()
        , $ul           = $("<ul>");

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
          link = "#/page/" + page
        }

        // Add class and link
        $a
          .addClass(_class)
          .attr("href", link)

        // Append the li_s
        $ul.append($li.append($a));
      }

      this.$el.append($ul);

      // Positionate it
      var w = $ul.outerWidth();
      $ul.css({ "margin-left": "-" + (w/2) + "px" })

      return this;
    },

    /**
     * Update the dashboard paginator
     */    
    _updatePaginator: function() {
      this.render();
    }
  });

  cdb.admin.dashboard.DashboardPaginator = DashboardPaginator;
})();