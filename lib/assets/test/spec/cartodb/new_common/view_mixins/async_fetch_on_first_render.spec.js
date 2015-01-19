var cdb =                    require('cartodb.js');
var Backbone =               require('backbone');
var AsyncFetchBeforeRender = require('new_common/view_mixins/async_fetch_on_first_render');


var sharedForAllScenarios = function() {
  describe('.render', function() {
    it('should return itself', function() {
      expect(this.view.render()).toBe(this.view);
    });
  });

  describe('and fetch is in process', function() {
    it('should only fetch once even if render is called multiple times', function() {
      this.view.render();
      this.view.render();
      this.view.render();
      expect(this.cfg.fetch).toHaveBeenCalled();
      expect(this.cfg.fetch.calls.count()).toEqual(1);
    });

    it('should render the default loading screen on view', function() {
      expect(this.innerHTML()).toContain('Loading...');
    });

    it('should not have any leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });

  describe('and fetch has finished & timeout period has passed', function() {
    beforeEach(function() {
      jasmine.clock().tick(this.sometimeAfterTimeout);
    });

    it('should not render the default loading screen anymore', function() {
      expect(this.innerHTML()).not.toContain('Loading...');
    });

    it('should not have any leaks', function() {
      expect(this.view).toHaveNoLeaks();
    });
  });
};


describe('new_common/view_mixins/async_fetch_on_first_render', function() {
  beforeEach(function() {
    jasmine.clock().install();
  });

  describe('given mixin is applied to a View', function() {
    beforeEach(function() {
      this.View = cdb.core.View.extend({
        initialize: function() {
          this.fetchedFinishedSuccessfully = 0;
        },
        render: function() {
          this.fetchedFinishedSuccessfully++;
          this.$el.html('finished!');
          return this;
        }
      });

      // Used to verify that timeout is properly cleared
      this.sometimeAfterTimeout = 3600000;
    });

    describe('and fetch will finish successfully', function() {
      beforeEach(function() {
        this.fetchDelay = 1010;
        this.originalRenderResult = 'original render not called?';
        (function(thisTest) {
          thisTest.opts = {
            fetch: function(callback) {
              setTimeout(function() {
                callback();
              }.bind(this), thisTest.fetchDelay);
            },
            renderLoading: function() {
              this.$el.html('Loading...');
            }
          };
        })(this);
        this.cfg = AsyncFetchBeforeRender.applyTo(this.View, this.opts);
        spyOn(this.cfg, 'fetch').and.callThrough();
        spyOn(this.cfg, 'timeout');

        this.view = new this.View();
        this.view.render();
      });

      sharedForAllScenarios();

      describe('and fetch is done', function() {
        beforeEach(function() {
          jasmine.clock().tick(this.sometimeAfterTimeout);
        });

        it('should have called original render', function() {
          expect(this.view.fetchedFinishedSuccessfully).toBeTruthy();
        });

        it('should not have called timeout', function() {
          expect(this.cfg.timeout).not.toHaveBeenCalled();
        });

        it('should only do fetch once, subsequent render() call original render', function() {
          this.view.render();
          expect(this.view.fetchedFinishedSuccessfully).toEqual(2);
        });

        it('should have rendered the result from original render', function() {
          expect(this.innerHTML()).toContain('finished!');
        });
      });
    });

    describe('and fetch will fail', function() {
      beforeEach(function() {
        this.fetchDelay = 1010;

        (function(thisTest) {
          thisTest.opts = {
            fetch: function(callback) {
              setTimeout(function() {
                callback('b0rked');
              }.bind(this), thisTest.fetchDelay);
            },
            failed: function() {
              this.$el.html('Failed...');
            },
            renderLoading: function() {
              this.$el.html('Loading...');
            }
          };
        })(this);
        this.cfg = AsyncFetchBeforeRender.applyTo(this.View, this.opts);
        spyOn(this.cfg, 'fetch').and.callThrough();
        spyOn(this.cfg, 'timeout');

        this.view = new this.View();
        this.mixinRender = this.view.render;
        this.view.render();
      });

      sharedForAllScenarios();

      describe('and after fetch failed', function() {
        beforeEach(function() {
          jasmine.clock().tick(this.sometimeAfterTimeout);
        });

        it('should not have called original render', function() {
          expect(this.view.fetchedFinishedSuccessfully).toBeFalsy();
        });

        it('should not have called timeout', function() {
          expect(this.cfg.timeout).not.toHaveBeenCalled();
        });

        it('should keep the mixin render (so render effectively works as a retry)', function() {
          expect(this.view.render).toBe(this.mixinRender);
        });

        it('should have called the provided fail callback', function() {
          expect(this.innerHTML()).toContain('Failed...');
        });

        it('should be able to retry', function() {
          this.view.render();
          jasmine.clock().tick(this.sometimeAfterTimeout);
          expect(this.cfg.fetch.calls.count()).toEqual(2);
          expect(this.innerHTML()).toContain('Failed...');
        });
      });
    });

    describe('and fetch will timeout', function() {
      beforeEach(function() {
        this.cfg = AsyncFetchBeforeRender.applyTo(this.View, {
          fetch: function(callback) {
            // do nothing, let the default timeout hit in
          },
          timeout: function() {
            this.$el.html('timed out... retry?');
          },
          renderLoading: function() {
            this.$el.html('Loading...');
          }
        });
        spyOn(this.cfg, 'fetch').and.callThrough();

        this.view = new this.View();
        this.mixinRender = this.view.render;
        this.view.render();
      });

      sharedForAllScenarios();

      describe('and fetch has timed out', function() {
        beforeEach(function() {
          spyOn(this.cfg, 'timeout').and.callThrough();
          jasmine.clock().tick(this.sometimeAfterTimeout);
        });

        it('should not have called original render', function() {
          expect(this.view.fetchedFinishedSuccessfully).toBeFalsy();
        });

        it('should have called the provided timeout callback', function() {
          expect(this.innerHTML()).toContain('timed out... retry?');
        });

        it('should keep the mixin render (so render effectively works as a retry)', function() {
          expect(this.view.render).toBe(this.mixinRender);
        });

        it('should be able to retry', function() {
          this.view.render();
          jasmine.clock().tick(this.sometimeAfterTimeout);
          expect(this.cfg.fetch.calls.count()).toEqual(2);
          expect(this.innerHTML()).toContain('timed out... retry?');
        });
      });
    });
    
    describe('and a custom time before timeout is set', function() {
      beforeEach(function() {
        this.sometimeAfterCustomTimeout = 5;
        this.cfg = AsyncFetchBeforeRender.applyTo(this.View, {
          fetch: function(callback) {
            // do nothing, let the default timeout hit in
          },
          timeout: function() {
            this.$el.html('timed out... retry?');
          },
          renderLoading: function() {
            this.$el.html('Loading...');
          },
          msBeforeAbortFetch: 0
        });
        spyOn(this.cfg, 'fetch').and.callThrough();

        this.view = new this.View();
        this.view.render();
      });

      sharedForAllScenarios();

      describe('and after timed out', function() {
        beforeEach(function() {
          jasmine.clock().tick(this.sometimeAfterCustomTimeout);
        });
        
        it('should timeout after given custom timeout', function() {
          expect(this.innerHTML()).toContain('timed out... retry?');
        });

        it('should be able to retry', function() {
          this.view.render();
          jasmine.clock().tick(this.sometimeAfterCustomTimeout);
          expect(this.cfg.fetch.calls.count()).toEqual(2);
          expect(this.innerHTML()).toContain('timed out... retry?');
        });
      });
    });
  });

  afterEach(function() {
    afterEach(function() {
      jasmine.clock().uninstall();
    });

    if (this.view) {
      this.view.clean();
    }
  });
});
