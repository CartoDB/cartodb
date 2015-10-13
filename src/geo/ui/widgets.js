
cdb.Widget = {};

cdb.Widget.View = cdb.core.View.extend({

  className: 'Widget',

  options: {
    template: '<div></div>',
    sync: true
  },

  initialize: function() {
    this.viewModel = new cdb.core.Model({
      type: this.options.type,
      title: this.options.title,
      template: this.options.template || '<div>',
      sync: this.options.sync,
      state: 'idle'
    });
    this.datasource = this.options.datasource;
    this.dataModel = this.datasource.addWidgetModel({
      name: this.options.name,
      type: this.options.type,
      columns: this.options.columns
    });
    this.template = _.template(this.viewModel.get('template'));
    this._initBinds();
  },

  render: function() {
    this.$el.html(
      this.template(this.viewModel.toJSON())
    )

    return this;
  },

  _initBinds: function() {
    var self = this;

    this.dataModel.bind('loading', function(){
      this.viewModel.set('state', 'loading');
      this.dataModel.unbind('loading', null, this);

      var onDone = function() {
        self.dataModel.unbind('error reset', null, self);
        self[ self.viewModel.get('sync') ? '_bindDatasource' : '_unbindDatasource' ]();
      };

      this.dataModel.bind('reset', function() {
        this.render();
        onDone();
      }, this);

      this.dataModel.bind('error', function() {
        this.render();
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

  _changeState: function(state) {
    this.viewModel.set('state', state);
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
