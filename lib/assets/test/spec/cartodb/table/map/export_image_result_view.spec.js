describe('export_image_result_view', function() {

  beforeEach(function() {
    this.filenameRegexp = '[\\S]+_by_[\\S]+_\\d\\d_\\d\\d_\\d\\d\\d\\d_\\d\\d_\\d\\d_\\d\\d';
    this.url = 'https://carto.com';

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
      height: 100
    });

    spyOn(this.view, '_loadMapImage').and.callFake(function(value, callback) {return callback(value);});
    spyOn(this.view, '_mergeAnnotations').and.returnValue('url');

    this.view.render();
  });

  afterEach(function() {
    this.view.clean();
  });

  it('should render the result view', function() {
    this.view.generateImage(this.url);
    expect(this.view.$('.js-open-image').length).toBe(1);
    expect(this.innerHTML()).toContain('Your image has been generated correctly');
    expect(this.view.$('p.Dialog-headerText').html()).toMatch('It\'s now available in: <a href="' + this.url + '" target="_blank" class="ExportImageResult--url" download="' + this.filenameRegexp + '">' + this.filenameRegexp + '.png</a>');
  });

  it('should close the dialog when clicking on the view image link', function() {
    this.view.generateImage(this.url);
    var hidden = false;
    this.view.bind('hide', function() {
      hidden = true;
    });
    this.view.$('.js-open-image').click();
    expect(hidden).toBe(true);
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
