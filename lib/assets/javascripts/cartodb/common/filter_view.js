
  /**
   * Dashboard filter view
   *
   *
   */


  cdb.ui.common.FilterView = cdb.core.View.extend({

    tagName: 'article',
    className: 'filter-view',

    options: {
      template_base: 'dashboard/views/filter_view'
    },

    events: {
      "submit form" :         "_onSubmit",
      "click li a":           "_onClickType",
      "click .tags-filter a": "_onFilterTags"
    },

    initialize: function() {
      this.user = this.options.user;
      this.router = this.options.router;
      this.visualizations = this.options.visualizations;
      this.tables = this.options.tables;

      this.template_base = cdb.templates.getTemplate(this.options.template_base);
      this._initBinds();
      this._initViews();
    },

    render: function() {
      var d = { belongsToOrg: this.user.isInsideOrg() };
      d = _.extend(d, this.router.model.attributes);

      this.$el.html(this.template_base(d));
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onFilterTags');
      this.router.model.bind('change', this.render, this);
      this.add_related_model(this.router.model);
    },

    _initViews: function() {
      this.filterTag = new cdb.admin.TagDropdown({
        className:          'dropdown tag_dropdown border',
        tables:             this.tables,
        visualizations:     this.visualizations,
        router:             this.router,
        host:               this.options.config.account_host,
        vertical_offset:    8,
        horizontal_offset:  5,
        template_base:      'common/views/tag_dropdown'
      });

      this.filterTag.bind("tag", this._onTagSelected, this);
      this.$el.append(this.filterTag.render().el);
      this.addView(this.filterTag);
      cdb.god.bind("closeDialogs", this.filterTag.hide, this.filterTag);
    },

    _onTagSelected: function(tag) {
      console.log("TAG: " + tag);
    },

    _onClickType: function(e) {
      this.killEvent(e);

      var where = $(e.target).attr('href');
      if (where) {
        where = where.replace('/dashboard', '');
        this.router.navigate(where, { trigger: true });
      }
    },

    _onFilterTags: function(e) {
      this.killEvent(e);
      this.filterTag.open(e, $(e.target));
    },

    _onSubmit: function(e) {
      this.killEvent(e);
      var q = this.$('input[type="text"]').val();
      var isShared = this.router.model.get('only_shared');
      var path = ( this.router.model.get('model') || 'tables' ) + ( isShared ? '/shared' : '' ) + ( q ? ('/search/' + q) : '' );
      this.router.navigate(path, { trigger: true });
    }

  });
