/**
 *  Dashboard filters.
 *
 *  - 'Order by' (time,likes,etc) collection.
 *  - 'Filter by' collection.
 *  - 'Search' any pattern within collection.
 *
 */

var cdb = require('cartodb.js');



module.exports = cdb.core.View.extend({

  className: 'DashboardFilters-inner',

  _TOOLTIPS: ['js-likes', 'js-mapviews', 'js-updated_at'],

  events: {
    'submit form':                        '_submitSearch',
    'click .DashboardFilters-orderLink':  '_changeOrder',
    'click .DashboardFilters-typeLink':   '_navigate'
  },

  initialize: function() {
    this.router = this.options.router;
    this.user = this.options.user;
    this.localStorage = this.options.localStorage;
    this.template = cdb.templates.getTemplate('new_dashboard/views/filters');

    this._initBinds();
  },

  render: function() {
    this.clearSubViews();

    // Content
    this.$el.html(
      this.template(
        _.extend({
            order:          this.localStorage.get('dashboard.order'),
            org:            this.user.isInsideOrg(),
            prefix:         cdb.config.prefixUrl(),
            selected_items: this._getSelectedItems()
          },
          this.router.model.attributes
        )  
      )
    );

    // Init views
    this._initViews();

    // Animations?
    this._animate();

    return this;
  },

  _initBinds: function() {
    this.router.model.on('change', this.render, this);
    this.collection.on('change reset', this.render, this);
  },

  _initViews: function() {
    // Tipsys?
    var self = this;
    _.each(this._TOOLTIPS, function(el,i){
      self.addView(
        new cdb.common.TipsyTooltip({
          el: self.$('.' + el),
          title: function(e) {
            return $(this).attr('data-title')
          }
        })
      )
    });
  },

  _getSelectedItems: function() {
    return this.collection.filter(function(mdl,i){
      return mdl.get('selected')
    }).length;
  },

  _animate: function() {
    var selected_items = this._getSelectedItems();
    // Show filters or selected items actions
    this.$el[ selected_items > 0 ? 'addClass' : 'removeClass' ]('items--selected');
  },

  _submitSearch: function(e) {
    if (e) e.preventDefault();
    var path = $(e.target).attr('action');
    var value = $(e.target).find('input[type="text"]').val();

    // Clean tag or search text
    path = path
      .replace('/search', '')
      .replace('/tag', '');

    // Check if user if looking for a :tag or a query
    if (value.search(':') === 0) {
      path += '/tag/' + value
    } else {
      path += '/search/' + value
    }

    this.router.navigate(path, {trigger: true});
  },

  _changeOrder: function(e) {
    if (e) e.preventDefault();

    var $el = $(e.target);
    var order = 'updated_at';

    if ($el.hasClass('js-mapviews')) order = 'mapviews';
    if ($el.hasClass('js-likes')) order = 'likes';

    // Order change?
    if (this.localStorage.get('dashboard.order') !== order) {
      this.localStorage.set({ 'dashboard.order': order });
      this.render();
      var order_obj = {};
      order_obj[order] = 'desc';
      this.collection.fetch({ data: { o: order_obj } });
    }
  },

  _navigate: function(e) {
    if (e && !e.metaKey) {
      e.preventDefault();
      var path = $(e.target).attr('href');
      this.router.navigate(path, {trigger: true});
    }
  }

})
