var createFavMapVis = require('new_public_dashboard/create_fav_map_vis');
var cdb = require('cartodb.js');

describe('new_public_dashboard/create_fav_map_vis', function() {
  beforeEach(function() {
    spyOn(cdb, 'createVis');
    this.createdVisSpy = jasmine.createSpyObj('cartodb.js vis', ['done']);
    cdb.createVis.and.returnValue(this.createdVisSpy);
    
    this.opts = {
      targetId: 'fav-map-container',
      url: '//host.ext/some/path/vis.json',
      opts: {}
    };
    
    this.$target = $('<div id="'+ this.opts.targetId +'"></div>');
    this.$target.appendTo(document.body);
  });
  
  describe('given required args', function() {
    beforeEach(function() {
      createFavMapVis(cdb, this.opts);
    });
    
    it('should create a visualization', function() {
      expect(cdb.createVis).toHaveBeenCalled();
    });

    it('should render vis in given target element identified by an id', function() {
      expect(cdb.createVis.calls.argsFor(0)[0]).toEqual(this.opts.targetId);
    });

    it('should create vis with given URL', function() {
      expect(cdb.createVis.calls.argsFor(0)[1]).toEqual('//host.ext/some/path/vis.json');
    });

    it('should create vis with a bunch of options', function() {
      expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.any(Object));
    });

    it('should load tiles from CDN by default', function() {
      expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({ no_cdn: false }));
    });

    it('should set .is-loading class on target element', function() {
      expect(this.$target.attr('class')).toContain('is-loading');
    });
  });

  describe('given loading finishes', function() {
    beforeEach(function() {
      createFavMapVis(cdb, this.opts);
      this.createdVisSpy.done.calls.argsFor(0)[0]();
    });
    
    it('should remove .is-loading class on target element', function() {
      expect(this.$target.attr('class')).not.toContain('is-loading');
    }); 
  });

  describe('given option to not load tiles from CDN', function() {
    beforeEach(function() {
      this.opts.opts.no_cdn = true;
      createFavMapVis(cdb, this.opts);
    });

    it('should create vis with not loading tiles from CDN', function() {
      expect(cdb.createVis.calls.argsFor(0)[2]).toEqual(jasmine.objectContaining({ no_cdn: true }));
    });
  });
  
  afterEach(function() {
    this.$target.remove();
  });
});
