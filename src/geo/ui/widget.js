
/**
 *  Default widget view:
 *
 *  It contains:
 *  - view model (viewModel)
 *  - datasource model (datasource)
 *  - data model (dataModel)
 *
 *  It will offet to the user:
 *  - get current data (getData)
 *  - filter the current datasource (filter), each view will let
 *  different possibilities.
 *  - Sync or unsync widget (sync/unsync), making the proper view
 *  listen or not changes from the current datasource.
 *
 */

cdb.geo.ui.Widget.View = cdb.core.View.extend({

  className: 'Widget Widget--light',

  options: {
    template: '<div></div>',
    sync: true
  },

  initialize: function() {
    if (!this.options.datasource) {
      throw new Error('Datasource is not defined');
    }
    this.viewModel = new cdb.core.Model(
      _.extend(
        this.options,
        {
          type: this.options.type,
          state: 'loading'
        }
      )
    );
    this.datasource = this.options.datasource;
    this.dataModel = this.datasource.addWidgetModel({
      id: this.options.id,
      sql: this.options.sql,
      name: this.options.name,
      type: this.options.type,
      columns: this.options.columns
    });

    this._initBinds();
  },

  render: function() {
    var template = _.template(this.viewModel.get('template'));
    this.$el.html(
      template(
        _.extend(
          this.viewModel.toJSON(),
          {
            data: this.dataModel.get('data')
          }
        )
      )
    );

    this._renderLoader();

    return this;
  },

  _initBinds: function() {
    var self = this;

    this.dataModel.bind('loading', function(){
      this._changeState('loading');
      this.dataModel.unbind(null, null, this);

      var onDone = function() {
        self.dataModel.unbind('error change:data', null, self);
        self[ self.viewModel.get('sync') ? '_bindDatasource' : '_unbindDatasource' ]();
      };

      this.dataModel.bind('change:data', function() {
        this._changeState('done');
        onDone();
      }, this);

      this.dataModel.bind('error', function() {
        this._changeState('error');
        onDone();
      }, this);

      // When first request is done, add listener when sync or state
      // attributes change
      this.viewModel.bind('change:sync', function() {
        this[ this.viewModel.get('sync') ? '_bindDatasource' : '_unbindDatasource' ]();
      }, this);

      this.viewModel.bind('change:state', this._onChangeState, this);
    }, this);
  },

  _onChangeState: function() {
    var state = this.viewModel.get('state');
    switch (state) {
      case 'loading':
        this._showLoader();
        this._hideError();
        break;
      case 'error':
        this._showError();
        this._hideLoader();
        break;
      default:
        this.render();
        this._hideError();
        this._hideLoader();
    }
  },

  _changeState: function(state) {
    this.viewModel.set('state', state);
  },

  _bindDatasource: function() {
    this.dataModel.bind('loading', function() {
      this._changeState('loading');
    }, this);
    this.dataModel.bind('change:data', function() {
      this._changeState('done');
    }, this);
    this.dataModel.bind('error', function() {
      this._changeState('error');
    }, this);
  },

  _renderLoader: function() {
    this._loader = new cdb.geo.ui.Widget.Loader();
    this.$el.append(this._loader.render().el);
  },

  _showLoader: function() {
    this._loader.show();
  },

  _hideLoader: function() {
    this._loader.hide();
  },

  _renderError: function() {

  },

  _showError: function() {

  },

  _hideError: function() {

  },

  _unbindDatasource: function() {
    this.dataModel.unbind(null, null, this);
  },

  sync: function() {
    this.viewModel.set('sync', true);
  },

  unsync: function() {
    this.viewModel.set('sync', false);
  },

  getData: function() {
    return this.dataModel.get('data');
  },

  filter: function() {
    throw new Error('Filter method not implemented for ' + this.dataModel.get('type') + ' Widget type');
  },

  clean: function() {
    this._unbindDatasource();
    this.viewModel.unbind(null, null, this);
    cdb.geo.ui.Widget.View.prototype.clean.call(this);
  }

});
