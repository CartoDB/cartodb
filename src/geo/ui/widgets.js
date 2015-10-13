
cdb.Widget = {};

cdb.Widget.View = cdb.core.View.extend({

  className: 'Widget',

  options: {
    template: '<div></div>',
    sync: true
  },

  initialize: function() {
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
    )

    return this;
  },

  _initBinds: function() {
    var self = this;

    this.dataModel.bind('loading', function(){
      this._changeState('loading');
      this.dataModel.unbind('loading', null, this);

      var onDone = function() {
        self.dataModel.unbind('error reset', null, self);
        self[ self.viewModel.get('sync') ? '_bindDatasource' : '_unbindDatasource' ]();
      };

      this.dataModel.bind('reset', function() {
        this._changeState('reset');
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

      this.viewModel.bind('change:state', this.render, this);
    }, this);
  },

  _changeState: function(state) {
    this.viewModel.set('state', state);
  },

  _bindDatasource: function() {
    this.dataModel.bind('loading', function() {
      this._changeState('loading');
    }, this);
    this.dataModel.bind('reset', function() {
      this._changeState('reset');
    }, this);
    this.dataModel.bind('error', function() {
      this._changeState('error');
    }, this);
  },

  _unbindDatasource: function() {
    this.dataModel.unbind('loading reset error', null, this);
  },

  sync: function() {
    this.viewModel.set('sync', true);
  },

  unsync: function() {
    this.viewModel.set('sync', false);
  },

  getDataModel: function() {
    return this.dataModel;
  },

  filter: function() {
    this.datasource.filter(arguments);
  }

});
