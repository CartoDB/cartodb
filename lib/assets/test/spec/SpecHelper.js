

var TestUtil = {};

TestUtil.createTable = function(name) {
  return new cdb.admin.CartoDBTableMetadata({ 
    name: name,
    schema: [
      ['test', 'number'],
      ['test2', 'string']
    ]
  });
};
