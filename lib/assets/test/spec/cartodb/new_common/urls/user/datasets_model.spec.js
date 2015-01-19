var DatasetsUrl = require('new_common/urls/user/datasets_model');
var UserUrl = require('new_common/urls/user_model');
var cdbAdmin = require('cdb.admin');

describe("new_common/urls/user/datasets_model", function() {
  beforeEach(function() {
    this.user = new cdbAdmin.User({
      id: 1,
      username: 'pepe'
    });

    this.userUrl = new UserUrl({
      user: this.user,
      account_host: 'host.ext'
    });

    this.url = new DatasetsUrl({
      userUrl: this.userUrl
    });
  });

  describe('.toDefault', function() {
    it('should return URL to default page', function() {
      expect(this.url.toDefault()).toMatch('(http|file)://pepe.host.ext/dashboard/datasets');
    });
  });

  describe('.toLocked', function() {
    it('should return URL to locked datasets', function() {
      expect(this.url.toLocked()).toMatch('(http|file)://pepe.host.ext/dashboard/datasets/locked');
    });
  });

  describe('.toShared', function() {
    it('should return URL to shared datasets', function() {
      expect(this.url.toShared()).toMatch('(http|file)://pepe.host.ext/dashboard/datasets/shared');
    });
  });

  describe('.toLiked', function() {
    it('should return URL to liked datasets', function() {
      expect(this.url.toLiked()).toMatch('(http|file)://pepe.host.ext/dashboard/datasets/liked');
    });
  });

  describe('.toLibrary', function() {
    it('should return URL to datasets library', function() {
      expect(this.url.toLibrary()).toMatch('(http|file)://pepe.host.ext/dashboard/datasets/library');
    });
  });
  
  describe('.toDataset', function() {
    beforeEach(function() {
      this.table = new cdbAdmin.CartoDBTableMetadata({
        name: '"pacos-and-pepes".actual_table_name'
      });
      
      this.datasetUrl = this.url.toDataset(this.table)
    });

    it('should return the URL to edit table without quotes and including the owner user', function() {
      expect(this.datasetUrl).toMatch('(http|file)://pepe.host.ext/tables/pacos-and-pepes.actual_table_name');
    });
  });
});
