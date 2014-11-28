var React = require('react');
var TableView = require('table/table_view/react_component');
var GlobalError = require('global_error/backbone_view');
var cdb = require('cartodbui');

// Mimic the original cdb.admin.TableView, so this replacement can act as a seamless replacement to render the table
// view, isolating the React rendering code to this view only.
cdb.admin.TableView = function(args) {
  // The actual render call is not working, so don't use...
  this.render = function() {
    if (!this.el) {
      this.el = document.createElement('div');
      React.render(<TableView
        table={args.model}
        layer={args.layer}
        user={args.user}
        tableData={args.dataModel}
        vis={args.vis}
      />, this.el);

      this._globalErrorView = new GlobalError(args);
    }

    return this;
  };
};

cdb.admin.TableView.prototype.clean = function() {
  if (this.el) {
    React.unmountComponentAtNode(this.el);
    this.el = undefined;

    this._globalErrorView.clean();
    this._globalErrorView = undefined;
  }
};

