const $ = require('jquery');
const CoreView = require('backbone/core-view');
const UserModel = require('dashboard/data/user-model');
const AuthenticatedUserModel = require('dashboard/data/authenticated-user-model');
const SQLViewData = require('dashboard/data/table/sqlviewdata-model');
const PublicCartoTableMetadata = require('./public-carto-table-metadata');
const PublicHeader = require('./public-header/public-header');
const PublicTableTab = require('dashboard/views/public-dataset/table-tab/public-table-tab');
const TabPane = require('dashboard/components/tabpane/tabpane');
const MapView = require('dashboard/views/public-dataset/map-view/map-view');
const Tabs = require('dashboard/components/tabs/tabs');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const ModalsServiceModel = require('builder/components/modals/modals-service-model');
const ViewFactory = require('builder/components/view-factory');
const templateApiDialog = require('dashboard/views/public-dataset/dialogs/api-call.tpl');
const PublicExportView = require('dashboard/views/public-dataset/dialogs/export/public-export-view');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  Table public view
 *
 */

module.exports = CoreView.extend({

  events: {
    'click .js-Navmenu-link--download': '_exportTable',
    'click .js-Navmenu-link--api': '_apiCallTable'
  },

  initialize: function (options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
    this._initModels();
    this._initViews();
    this._initBinds();
  },

  _initModels: function () {
    this._modals = new ModalsServiceModel();
    // Table
    this.table = new PublicCartoTableMetadata({
      id: this.options.table_name,
      name: this.options.table_name,
      description: this.options.vizjson.description || ''
    }, { configModel: this._configModel });

    this.table.set({
      user_name: this.options.user_name,
      vizjson: this.options.vizjson,
      schema: this.options.schema
    });

    this.columns = this.table.data();
    this.sqlView = new SQLViewData(null, {
      configModel: this._configModel
    });
    this.sqlView.syncMethod = 'read';

    var query = this.query = this.table.data().getSQL();
    this.table.useSQLView(this.sqlView);
    this.sqlView.options.set('rows_per_page', 20, { silent: true });
    this._fetchData(query);

    // User
    this.user = new UserModel({ username: this.options.user_name });

    // Authenticated user
    this.authenticated_user = new AuthenticatedUserModel();
  },

  _initViews: function () {
    // Public header
    if (this.$('.cartodb-public-header').length > 0) {
      var header = new PublicHeader({
        el: this.$('.cartodb-public-header'),
        model: this.authenticated_user,
        vis: this.table,
        current_view: this._getCurrentView(),
        owner_username: this.options.owner_username,
        isMobileDevice: this.options.isMobileDevice,
        isCartoDBHosted: this._configModel.get('cartodb_com_hosted')
      });
      this.addView(header);

      // Fetch authenticated user model
      this.authenticated_user.fetch();
    }

    // Navigation - This is what switches the view on mobile
    // TODO: this is insanely complex for just two buttons
    // this.header = new cdb.open.PublicHeader({
    //   el: this.$('.navigation'),
    //   model: this.table,
    //   user: this.user,
    //   belong_organization: belong_organization,
    //   config: this.options.config
    // });
    // this.addView(this.header);

    // Tabpanes
    this.workViewTable = new TabPane({
      el: this.$('.pane_table')
    });
    this.addView(this.workViewTable);

    this.workViewMap = new TabPane({
      el: this.$('.pane_map')
    });
    this.addView(this.workViewMap);

    // Public app tabs
    this.tabs = new Tabs({
      el: this.$('.navigation ul'),
      slash: true
    });

    this.addView(this.tabs);

    // Help tooltip - I can't find any span with help class, I think this is unnecessary
    // var tooltip = new cdb.common.TipsyTooltip({
    //   el: this.$('span.help'),
    //   gravity: $.fn.tipsy.autoBounds(250, 's')
    // });
    // this.addView(tooltip);

    // Table tab
    this.tableTab = new PublicTableTab({
      configModel: this._configModel,
      model: this.table,
      vizjson: this.options.vizjson,
      user_name: this.options.user_name
    });

    // Map tab
    this.mapTab = new MapView({
      username: this.options.user_name,
      serverUrl: this._configModel.get('maps_api_template').replace('{user}', this.options.user_name),
      sqlUrl: this._configModel.getSqlApiUrl(),
      dataset: this.table.get('name'),
      vizjson: this.table.get('vizjson'),
      geometry: this.table.get('geometry_types')
    });
    this.listenTo(this.mapTab, 'mapBoundsChanged', function (options) {
      const {
        bounds,
        center,
        zoom
      } = options;
      this.model.set('map', {
        bounds: [
          bounds.getNorthEast().lng,
          bounds.getNorthEast().lat,
          bounds.getSouthWest().lng,
          bounds.getSouthWest().lat
        ],
        center,
        zoom
      });
    });
    this.listenTo(this.mapTab, 'boundsChanged', function (options) {
      this.model.set('bounds', options.bounds);
    });

    this.workViewTable.addTab('table', this.tableTab.render());
    this.workViewMap.addTab('map', this.mapTab.render());

    this.workViewTable.active('table');
    this.workViewMap.active('map');
    this.mapTab.enableMap();

    $('.pane_table').addClass('is-active');
  },

  _updateTable: function () {
    var sql = (this.model.get('bounds') && this.model.get('map')) ? (this.query + ' WHERE the_geom && ST_MakeEnvelope(' + this.model.get('map')['bounds'][0] + ', ' + this.model.get('map')['bounds'][1] + ', ' + this.model.get('map')['bounds'][2] + ', ' + this.model.get('map')['bounds'][3] + ', 4326)') : this.query;
    this._fetchData(sql);
  },

  _fetchData: function (sql) {
    if (sql) {
      this.sqlView.setSQL(sql);
    }

    this.sqlView.fetch({
      success: () => {
        this.$('.js-spinner').remove();
        this.tableTab.deactivated();
        this.tableTab.activated();
      }
    });
  },

  _exportTable: function (e) {
    e.preventDefault();

    // If a sql is applied but it is not valid, don't let the user export it
    if (!this.sqlView.getSQL()) return false;

    this._modals.create((modalModel) =>
      new PublicExportView({
        modalModel,
        configModel: this._configModel,
        model: this.table,
        user_data: this.user.toJSON(),
        bounds: this.sqlView.getSQL() !== this.query
      })
    );
  },

  _apiCallTable: function (e) {
    e.preventDefault();

    // If a sql is applied but it is not valid, don't show the dialog
    if (!this.sqlView.getSQL()) return false;

    this._modals.create(() =>
      ViewFactory.createByTemplate(
        templateApiDialog,
        {
          url: this._configModel.getSqlApiUrl(),
          sql: this.sqlView.getSQL(),
          schema: this.table.attributes.original_schema.slice(0, 5),
          rows: this.table.dataModel.models
        }
      )
    );
  },

  _initBinds: function () {
    this.listenTo(this.model, 'change:bounds', function (model) {
      this._updateTable();
    });

    this.listenTo(this.model, 'change:map', function (model) {
      if (model.get('bounds')) {
        this._updateTable();
      }
    });

    this.authenticated_user.bind('change', this._onUserLogged, this);

    this.add_related_model(this.authenticated_user);

    this.listenToOnce(this.table, 'change:geometry_types', function (model) {
      this.mapTab.setGeometry(model.get('geometry_types'));
    });
  },

  // Get type of current view
  // - It could be, dashboard, table or visualization
  _getCurrentView: function () {
    var pathname = location.pathname;

    if (pathname.indexOf('/tables/') !== -1) {
      return 'table';
    }

    if (pathname.indexOf('/viz/') !== -1) {
      return 'visualization';
    }

    // Other case -> dashboard (datasets, visualizations,...)
    return 'dashboard';
  },

  keyUp: function (e) {},

  _onUserLogged: function () {
    // Check if edit button should be visible
    if (this.options.owner_username === this.authenticated_user.get('username')) {
      this.$('.extra_options .edit').css('display', 'inline-block');
      this.$('.extra_options .oneclick').css('display', 'none');
    }
  },

  invalidateMap: function () {
    this.mapTab.invalidateMap();
  },

  showTable: function () {
    $('.pane_table').addClass('is-active');
    $('.pane_map').removeClass('is-active');
    this.tabs.activate('table');
  },

  showMap: function () {
    $('.pane_table').removeClass('is-active');
    $('.pane_map').addClass('is-active');
    this.tabs.activate('map');
  }
});
