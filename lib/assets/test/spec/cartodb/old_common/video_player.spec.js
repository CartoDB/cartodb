describe('VideoPlayer', function() {
  var view, localStorage;

  beforeEach(function() {

    localStorage = new cdb.admin.localStorage("VideoPlayer");
    localStorage.destroy();

    cdb.templates.add(new cdb.core.Template({
      name: 'old_common/views/video_player',
      compiled: _.template('<iframe class="VideoPlayer-videoIframe" src="//player.vimeo.com/video/<%= id %>?api=1&title=0&byline=0&portrait=0"></iframe>')
    }));

    view = new cdb.admin.VideoPlayer();

  });

  afterEach(function() {
    if (localStorage) {
      localStorage.destroy();
    }
    view.remove();
  })

  it("shouldn't start if there's no video data", function() {
    view.render();
    expect(view.hasVideoData()).toEqual(false)
  });

  it("should render if an id is provided", function() {
    var id = 122308083;
    var v = new cdb.admin.VideoPlayer({ id: id });
    v.render();
    expect(v.hasVideoData()).toEqual(true);
    expect(v.model.get("video_id")).toEqual(id);
    expect(v.$el.find("iframe").length).toBe(1);
  });

  it("should clear the localstorage when the player is closed", function() {
    var id = 122308083;
    var v = new cdb.admin.VideoPlayer({ video_id: id });
    v.render();
    v.close(null, { dontHide: true });
    expect(v.hasVideoData()).toEqual(false);
    expect(v.model.localStorage.get("currentVideo")).toEqual(null);
  });

  it("should render if there's video data", function() {
    localStorage = new cdb.admin.localStorage("VideoPlayer");

    id = 122308083;

    var data = {
      currentVideo: {
        video_id: id
      }
    };

    localStorage.set(data);

    var v = new cdb.admin.VideoPlayer();
    v.render();

    expect(v.hasVideoData()).toEqual(true);
    expect(v.model.videoData.video_id).toEqual(id);

    expect(v.$el.find("iframe").length).toBe(1);
  });

  it("should change the size", function() {
    var id = 122308083;
    var v = new cdb.admin.VideoPlayer({ video_id: id });
    v.render();
    $("body").append(v.$el);
    expect(v.model.get("width")).toEqual(420);
    expect(v.model.get("height")).toEqual(236);
    v.model.set("minimized", false);
    expect(v.model.get("width")).toEqual(700);
    expect(v.model.get("height")).toEqual(393);
  });
});

