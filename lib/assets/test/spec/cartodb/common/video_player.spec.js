describe('VideoPlayer', function() {
  var view, localStorage;

  beforeEach(function() {
    cdb.templates.add(new cdb.core.Template({
      name: 'cartodb/new_dashboard/views/video_player',
      compiled: _.template('<iframe class="VideoPlayer-videoIframe" src="//player.vimeo.com/video/<%= id %>?api=1&title=0&byline=0&portrait=0"></iframe>')
    }));
    view = new cdb.admin.VideoPlayer();
  });

  afterEach(function() {
    if (localStorage) {
      delete localStorage['VideoPlayer'];
    }
    view.remove();
  })

  xit("shouldn't start if there's no video data", function() {
    view.render();
    expect(view.hasVideoData()).toEqual(false)
  });

  it("should render if there's video data", function() {
    localStorage = new cdb.admin.localStorage("VideoPlayer");

    var id = 122308083;

    var data = {
       currentVideo: {
         id: id
       }
    };

    localStorage.set(data);

    var v = new cdb.admin.VideoPlayer();
    view.render();
    expect(view.hasVideoData()).toEqual(true)
    expect(view.videoData.id).toEqual(id)
    expect(view.$el.find("iframe").length).toBe(1)
  });

  it("should render if an id is provided", function() {
    var id = 122308083;
    var v = new cdb.admin.VideoPlayer({ id: id });
    view.render();
    expect(view.hasVideoData()).toEqual(true)
    expect(view.videoData.id).toEqual(id)
    expect(view.$el.find("iframe").length).toBe(1)
  });

  it("should clear the localstorage when the player is closed", function() {
    var id = 122308083;
    var v = new cdb.admin.VideoPlayer({ id: id });
    view.render();
    view.close(null, { dontHide: true });
    expect(view.hasVideoData()).toEqual(false);
    expect(view.localStorage.get("currentVideo")).toEqual(null);
  });

});
