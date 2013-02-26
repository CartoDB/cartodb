

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
        tables: model.tables*
      });

      * It needs a tables model to run correctly.
  */

  var DashboardPaginator = cdb.core.View.extend({
    events: {
      'click a': 'pageChange'
    },

    initialize: function() {
      _.bindAll(this, "_updatePaginator", "pageChange");

      this.model  = new cdb.core.Model();
      this.tables = this.options.tables;

      this.add_related_model(this.tables);

      // Bindings
      this.tables.bind('reset add remove', this._updatePaginator, this);
      this.model.bind('change:visible', this._toggleVisibility, this);

    },

    render: function() {

      this.$el.html("");

      var attrs         = this.tables.options.attributes
        , current_page  = this.tables.options.get("page")
        , total_pages   = this.tables.getTotalPages()
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

    pageChange: function(ev) {
      if($(ev.currentTarget).attr('href') != location.hash) {
        this.trigger('loadingPage');
      }
      // testeability
      if(this.cancelClicks) {
        this.killEvent(ev);
      }
    },

  });

  cdb.admin.dashboard.DashboardPaginator = DashboardPaginator;

})();
