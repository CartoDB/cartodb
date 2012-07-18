/*
  DOC it
  Refactor it
  Add tests
  Best animation: appear empty and then fill them
*/


(function() {

  /**
   * dasboard table stats
   */
  var TableStats = cdb.core.View.extend({
    tagName: 'ul',
    defaults: {
      loaded: false
    },

    initialize: function() {
      this.model = new cdb.admin.User({ id : this.options.userid });

      this.template = cdb.templates.getTemplate('dashboard/views/table_stats_list');

      this.options.tables.bind('add',     this.tableChange, this);
      this.options.tables.bind('remove',  this.tableChange, this);
      this.options.tables.bind('reset',   this.tableChange, this);

      this.model.bind('change', this.render, this);
    },

    tableChange: function() {
      this.model.fetch();
    },

    render: function() {

      // Check tables count quota status
      if (((this.model.attributes.table_count / this.model.attributes.table_quota) * 100) < 80) {
        this.model.attributes.table_quota_status = "";
      } else {
        if (((this.model.attributes.table_count / this.model.attributes.table_quota) * 100) < 90) {
          this.model.attributes.table_quota_status = "danger";
        } else {
          this.model.attributes.table_quota_status = "boom";
        }
      }

      // Check table space quota status
      if ((((this.model.attributes.byte_quota - this.model.attributes.remaining_byte_quota) / this.model.attributes.byte_quota) * 100) < 80) {
        this.model.attributes.byte_quota_status = "";
      } else {
        if ((((this.model.attributes.byte_quota - this.model.attributes.remaining_byte_quota) / this.model.attributes.byte_quota) * 100) < 90) {
          this.model.attributes.byte_quota_status = "danger";
        } else {
          this.model.attributes.byte_quota_status = "boom";
        }
      }

      if (!this.options.loaded) {
        this.options.loaded = !this.options.loaded;
        this.$el.html(this.template(this.model.toJSON()));

        // Animate it!
        this._animateInit();

        // D3 API Requests
        this.stats = this.stats = new cdb.admin.D3Stats({
          el: this.$("div.stats")
        });
      } else {
        this._animateChange();
      }

      return this;
    },

    _animateInit: function() {

      this.$el.find("li").each(function(i,ele){
        setTimeout(function(){
          $(ele).animate({opacity:1}, {duration:500, queue: true});
        },300*i);
      });
      // this.$el.parent().animate({
      //   marginTop:0
      // },500, function(){
      //   $(this).css({zIndex: 1})
      // })
    },

    _animateChange: function() {

      // First li
      var $first_li = this.$el.find("li:eq(0)")
        , attrs = this.model.attributes;
      $first_li.find("div.progress span").removeAttr("class").addClass(attrs.table_quota_status);
      $first_li.find("p").html("<strong>" + attrs.table_count + " of " + attrs.table_quota + "</strong> tables created");
      $first_li.find("div.progress span").animate({
        width: ((attrs.table_count / attrs.table_quota) * 100) + "%"
      },500)

      // Second li
      var $sec_li = this.$el.find("li:eq(1)");
      $sec_li.find("div.progress span").removeAttr("class").addClass(attrs.byte_quota_status);
      $sec_li.find("p").html("<strong>" + (( attrs.byte_quota - attrs.remaining_byte_quota ) / (1024*1024)).toFixed(2) + " of " + (attrs.byte_quota / (1024*1024)).toFixed(0) + "</strong> used megabytes");
      $sec_li.find("div.progress span").animate({
        width: (((attrs.byte_quota - attrs.remaining_byte_quota) / attrs.byte_quota) * 100) + "%"
      },500)

    }
  });

  cdb.admin.dashboard.TableStats = TableStats;
})();



