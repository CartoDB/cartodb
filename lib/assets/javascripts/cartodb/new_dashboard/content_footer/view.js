var cdb = require('cartodb.js');
var PaginationModel = require('new_common/pagination/model');
var PaginationView = require('new_common/pagination/view');

/**
 * Responsible for the content footer of the layout.
 *  ___________________________________________________________________________
 * |                                                                           |
 * | [show your locked datasets/maps]           Page 2 of 42 [1] 2 [3][4][5]  |
 * |___________________________________________________________________________|
 *
 */
module.exports = cdb.core.View.extend({
  initialize: function(args) {
    if (!args.el) throw new Error('The root element must be provided from parent view');

    this.collection = args.collection;
    this.router = args.router;
    this.router.model.bind('change', this.render, this);

    this.add_related_model(this.router);
  },

  render: function() {
    this.clearSubViews();

    this._renderShowLockedLink();
    this._renderPagination();

    return this;
  },

  _renderShowLockedLink: function() {
    // TODO: implement later
  },

  _renderPagination: function() {
    var model = new PaginationModel({
      visibleCount:  5,
      perPage:       this.collection.options.get('per_page'),
      totalCount:    this.collection.total_entries,
      page:          this.router.model.get('page'),
      urlTo:         function(page) { this.router.getCurrentState('/'+ page) }.bind(this) // TODO: make sure search/tag is included if set
    });

    var view = new PaginationView({
      model: model
    });
    view.render();
    this.$el.append(view.el);
    this.addView(view);
  }
});
