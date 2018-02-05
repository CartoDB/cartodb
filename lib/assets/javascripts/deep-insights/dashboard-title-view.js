var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var _ = require('underscore');
var $ = require('jquery');
var template = require('./dashboard-menu-view.tpl');
var moment = require('moment');
var Ps = require('perfect-scrollbar');

var DashboardTitleView = CoreView.extend({
  className: 'CDB-Dashboard-title',

  events: {
    'click .js-toggle': '_toogle'
  },

  initialize: function () {
    console.log("title");
    // this.viewModel = new Backbone.Model({
    //   open: false,
    //   small: $(window).width() < BREAKPOINT
    // });

    // this._initBinds();
  },

  _initBinds: function () {
    // this.listenTo(this.viewModel, 'change', this.render);
    // this._resize = _.debounce(this._onResizeWindow.bind(this), 20);
    // $(window).on('resize', this._resize);
  },

  render: function () {
    // var shortTitle = this.model.get('title');
    // var isOpen = this.viewModel.get('open');
    // var isSmall = this.viewModel.get('small');

    // if (shortTitle && shortTitle.length > 120) {
    //   shortTitle = shortTitle.slice(0, 110) + '...' + ' %23 map';
    // }

    // this.$el.html(
    //   template({
    //     hasTranslation: isOpen || isSmall,
    //     showLogo: this.model.get('showLogo'),
    //     title: this.model.get('title'),
    //     description: this.model.get('description'),
    //     updatedAt: moment(this.model.get('updatedAt')).fromNow(),
    //     userName: this.model.get('userName'),
    //     url: window.location.href,
    //     urlWithoutParams: window.location.protocol + '//' + window.location.host + window.location.pathname,
    //     inIframe: (window.location !== window.parent.location),
    //     shortTitle: shortTitle,
    //     userAvatarURL: this.model.get('userAvatarURL'),
    //     userProfileURL: this.model.get('userProfileURL')
    //   })
    // );

    // this.$el.toggleClass('is-active', isOpen);

    // var content = this._getDescription().get(0);
    // Ps.initialize(content, {
    //   wheelSpeed: 2,
    //   suppressScrollX: true
    // });

    return this;
  }
});

module.exports = DashboardTitleView;
