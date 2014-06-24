
  /**
   *  Dashboard filter view
   *
   *  var filterView = new cdb.ui.common.FilterView({
   *    visualizations: visualizations_model,
   *    config:         config,
   *    tables:         tables_model,
   *    user:           user_model,
   *    router:         backbone_router
   *  });
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

      this.model = new cdb.core.Model({ visible: true });

      this.template_base = cdb.templates.getTemplate(this.options.template_base);
      this._initBinds();
      this._initViews();
    },

    render: function() {
      var d = {
        belongsToOrg: this.user.isInsideOrg(),
        visible:      this.model.get('visible')
      };
      d = _.extend(d, this.router.model.attributes);

      this.$el.html(this.template_base(d));
      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onFilterTags');
      this.router.model.bind('change', this.render, this);
      this.add_related_model(this.router.model);
      
      this.tables.bind('loaded',          this._onCollectionFetched, this);
      this.visualizations.bind('loaded',  this._onCollectionFetched, this);

      this.add_related_model(this.tables);
      this.add_related_model(this.visualizations);
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
    },

    _onCollectionFetched: function() {
      var model = this.router.model.get('model');
      var visible = this[model].get('total_entries') > 0;
      this.model.set('visible', visible);
      this[ visible ? 'show' : 'hide' ]();
    },

    hide: function() {
      this.$('div.filters').removeClass('visible');
    },

    show: function() {
      this.$('div.filters').addClass('visible');
    }

  });
