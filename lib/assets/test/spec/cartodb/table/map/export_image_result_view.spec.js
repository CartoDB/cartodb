describe('export_image_result_view', function() {

  beforeEach(function() {
    this.filenameRegexp = '[\\S]+_by_[\\S]+_\\d\\d_\\d\\d_\\d\\d\\d\\d_\\d\\d_\\d\\d_\\d\\d';
    this.url = 'http://www.cartodb.com';

    this.vis = new cdb.admin.Visualization({
      type: 'derived',
      name: 'my name'
    });

    this.view = new cdb.editor.ExportImageResultView({
      vis: this.vis,
      clean_on_hide: true,
      enter_to_confirm: false,
      user: TestUtil.createUser('jamon'),
      x: 0,
      y: 0,
      format: 'png',
      width: 100,
      height: 100,
      avmm: true
    });

    spyOn(this.view, '_loadMapImage').and.callFake(function(value, callback) {return callback(value);});
    spyOn(this.view, '_mergeAnnotations').and.returnValue('url');

    this.view.render();
  });

  afterEach(function() {
    this.view.clean();
  });

  it('should trigger a finish event', function() {
    var finish = false;
    this.view.bind('finish', function() {
      finish = true;
    });
    this.view.generateImage(this.url);
    expect(finish).toBe(true);
  });

  it('should generate exported image filename correctly', function() {
    var filename = this.view._generateImageFilename();
    expect(filename).toMatch(this.filenameRegexp);
  });

});
