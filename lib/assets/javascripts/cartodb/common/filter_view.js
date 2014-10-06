
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
      "submit form":  "_onSubmit",
      "click li a":   "_onClickType",
      "click":        "_onViewClick"
    },

    initialize: function() {
      this.user = this.options.user;
      this.router = this.options.router;
      this.visualizations = this.options.visualizations;
      this.tables = this.options.tables;
      this.tags = new cdb.admin.Tags();

      this.model = new cdb.core.Model({ visible: true });

      this.template_base = cdb.templates.getTemplate(this.options.template_base);
      this._initBinds();
      this._initViews()
    },

    render: function() {
      var d = {
        belongsToOrg: this.user.isInsideOrg(),
        visible:      this.model.get('visible')
      };
      d = _.extend(d, this.router.model.attributes);

      this.$el.html(this.template_base(d));

      // Set filter target
      this.filterTag.setTarget(this.$('a.filter'));

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onViewClick');

      this.router.model.bind('change', this.render, this);
      this.add_related_model(this.router.model);
      
      this.tables.bind('add remove reset',          this._onCollectionFetched, this);
      this.visualizations.bind('add remove reset',  this._onCollectionFetched, this);

      this.add_related_model(this.tables);
      this.add_related_model(this.visualizations);
    },

    _initViews: function() {
      this.filterTag = new cdb.admin.TagDropdown({
        className:          'dropdown tag_dropdown border',
        target:             this.$("a.filter"),
        tags:               this.tags,
        tables:             this.tables,
        visualizations:     this.visualizations,
        router:             this.router,
        vertical_offset:    8,
        horizontal_offset:  5,
        template_base:      'common/views/tag_dropdown'
      });

      this.filterTag.bind("tag", this._onTagSelected, this);

      $('body').append(this.filterTag.render().el);
      this.addView(this.filterTag);

      cdb.god.bind("closeDialogs", this.filterTag.hide, this.filterTag);
    },

    _onViewClick: function(e) {
      this.$('form input').focus();
    },

    _onTagSelected: function(tag) {
      var type = this.router.model.get('model');
      var onlyMine =  this.router.model.get('exclude_shared');
      var onlyLocked =  this.router.model.get('locked');

      var path = type +
        ( onlyMine ? '/mine' : '' ) +
        ( onlyLocked ? '/locked' : '' ) +
        ('/tag/' + tag );

      this.router.navigate(path, { trigger: true });
    },

    _onClickType: function(e) {
      this.killEvent(e);

      var where = $(e.target).attr('href');
      if (where) {
        where = where.replace('/dashboard', '');
        this.router.navigate(where, { trigger: true });
      }
    },

    _onSubmit: function(e) {
      this.killEvent(e);

      // If it is a name search
      var val = this.$('input[type="text"]').val();
      var action = 'search';

      if (val.search(':') === 0) {
        // Or is it a tag?
        action = 'tag';
        val = val.split(':')[1];
      }
      
      var onlyMine = this.router.model.get('exclude_shared');
      var onlyLocked = this.router.model.get('locked');

      var path = ( this.router.model.get('model') || 'tables' ) +
        ( onlyMine ? '/mine' : '' ) +
        ( onlyLocked ? '/locked' : '' ) +
        ( val ? ('/' + action + '/' + val) : '' );

      this.router.navigate(path, { trigger: true });
    },

    _onCollectionFetched: function() {
      var params = this.router.model.attributes;
      var visible = params.tag || params.q || params.model === "visualizations" || this[params.model].total_entries > 0;
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
