React = require('react');
Table = require('table/tableview');


// Mimic the original cdb.admin.TableView, so this replacement can act as a seamless replacement to render the table
// view, isolating the React rendering code to this view only.
cdb.admin.TableView = function(args) {
  window.dataModel = args.dataModel;

  // The actual render call is not working, so don't use...
  this.render = function() {
    if (!this.el) {
      this.el = document.createElement('div');
      React.render(<Table
        table={args.model}
        layer={args.layer}
        user={args.user}
        tableData={args.dataModel}
      />, this.el);
    }
    return this;
  };
};

cdb.admin.TableView.prototype.clean = function() {
  if (this.el) {
    React.unmountComponentAtNode(this.el);
    this.el = undefined;
  }
};

