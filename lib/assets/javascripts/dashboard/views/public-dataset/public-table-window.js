/* global DISQUS */
const Backbone = require('backbone');
const _ = require('underscore');
const CoreView = require('backbone/core-view');
const $ = require('jquery');
const TablePublicView = require('dashboard/views/public-dataset/table-public-view');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  Public table window 'view'
 *
 */

module.exports = CoreView.extend({
  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this.$body = $(this.el.document.body);
    this.$map = this.$body.find('#map');
    this._initBinds();
    this._initViews();
    setTimeout(this._onStart, 250);
  },

  _initViews: function () {
    // Table view
    var table_options = _.defaults({ el: this.el.document.body, model: new Backbone.Model({ bounds: false, map: null }) }, this.options);
    this.table = new TablePublicView(table_options);

    const activeTab = (window.location.hash || '').split('/')[1];
    this._setActiveTab(activeTab);
  },

  _initBinds: function () {
    _.bindAll(this, '_onWindowResize', '_onOrientationChange', '_onStart');

    this.$el.on('resize', this._onWindowResize);

    if (!this.el.addEventListener) {
      this.el.attachEvent('orientationchange', this._onOrientationChange, this);
    } else {
      this.el.addEventListener('orientationchange', this._onOrientationChange);
    }

    this.$body.find('.navigation a[data-pane]').click(this._onNavigationClick.bind(this));
  },

  // On start view!
  _onStart: function () {
    this._setupMapDimensions();
  },

  _onWindowResize: function () {
    // Resize window
    this._setupMapDimensions();
  },

  _onOrientationChange: function () {
    // Reset disqus
    DISQUS && DISQUS.reset({ reload: true });
    // Resize window orientation
    this._setupMapDimensions(true);
  },

  _onNavigationClick: function (event) {
    const clickedElement = event.currentTarget;
    const paneToShow = clickedElement.getAttribute('data-pane');

    this._setActiveTab(paneToShow);

    if (this.table) this.table.invalidateMap();
  },

  _setActiveTab: function (tab) {
    if (tab === 'table') {
      this.table.showTable();
    } else if (tab === 'map') {
      this.table.showMap();
    }
  },

  // When window is resized, let's touch some things ;)
  _setupMapDimensions: function (animated) {
    var windowHeight = this.$el.height();
    var mainInfoHeight = this.$body.find('.js-Navmenu').height();
    var headerHeight = this.$body.find('.Header').height();
    var landscapeMode = this.el.matchMedia && this.el.matchMedia('(orientation: landscape)').matches;
    var h, height;

    if (this.options.isMobileDevice) {
      if (landscapeMode) {
        h = headerHeight + 7;
      } else {
        if (windowHeight > 670) {
          h = 220;
        } else { // iPhone, etc.
          h = 138;
        }
      }
    } else {
      h = 260;
    }

    height = windowHeight - h;

    if (animated) {
      this.$map.animate({ height: height }, { easing: 'easeInQuad', duration: 150 });
    } else {
      if (this.options.isMobileDevice) {
        this.$map.css({ height: height, opacity: 1 });
      } else {
        // On non mobile devices
        this.$map.css({ height: windowHeight - (mainInfoHeight + headerHeight), opacity: 1 });
      }
    }

    // If landscape, let's scroll to show the map, and
    // leave the header hidden
    if (this.options.isMobileDevice && landscapeMode && $(window).scrollTop() < headerHeight) {
      this.$body.animate({ scrollTop: headerHeight }, 600);
    }

    if (this.table) this.table.invalidateMap();

    this._showNavigationBar();
  },

  // Show navigation (table or map view) block
  _showNavigationBar: function () {
    this.$body.find('.navigation')
      .animate({ opacity: 1 }, 250);

    if (this.table) this.table.invalidateMap();
  }

});
