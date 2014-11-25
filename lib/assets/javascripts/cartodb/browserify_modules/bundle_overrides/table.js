React = require('react');
Table = require('table/tableview');


// Mimic original interface
cdb.admin.TableView = function(args) {
  this.render = function() {
    if (!this.el) {
      this.el = document.createElement('div');
      React.render(<Table visualisation={args.vis} />, this.el);
    }
    return this;
  };
};

cdb.admin.TableView.prototype.clean = function() {
  if (this.el) {
    React.unmountComponentAtNode(this.el);
  }
};

