var cdb = require('cartodb.js');
cdb.admin = require('cdb.admin');
var $ = require('jquery');

module.exports = cdb.admin.DropdownMenu.extend({
  events: {
    'click a': '_navigateToLinksHref'
  },

  initialize: function(args) {
    this.constructor.__super__.initialize.apply(this);

    this.router = args.router;
    this.add_related_model(this.router);
  },


  render: function() {
    var prefixUrl = cdb.config.prefixUrl();
    this.$el.html(this.template_base({
      mapsUrl:           prefixUrl +'/dashboard/maps',
      datasetsUrl:       prefixUrl +'/dashboard/datasets',
      lockedDatasetsUrl: prefixUrl +'/dashboard/datasets/locked',
      lockedMapsUrl:     prefixUrl +'/dashboard/maps/locked'
    }));

    // Necessary to hide dialog on click outside popup, for example.
    cdb.god.bind('closeDialogs', this.hide, this);

    // TODO: taken from existing code, how should dropdowns really be added to the DOM?
    $('body').append(this.el);

    return this;
  },

  _navigateToLinksHref: function(ev) {
    if (!ev.metaKey) {
      this.killEvent(ev);
      this.hide(); //hide must be called before routing for proper deconstruct of dropdown

      var path = $(ev.target).attr('href');
      this.router.navigate(path, { trigger: true });
    }
  }
});
