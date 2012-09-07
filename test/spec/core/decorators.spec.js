describe("decorators", function() {

  describe("cbd.decorators.super", function() {
      var getMocks = function() {
        this.plane = Backbone.Model.extend({
          speed: 0,
          heading: 12,
          accelerate: function() {this.speed += 10;},
          turn: function(direction) {
            if(direction === 'L') {
              this.heading === 1?
                this.heading = 12:
                this.heading--;
              } else {
              this.heading === 12?
                this.heading = 1:
                this.heading++;
            }
          }
        })

        this.spitfire = this.plane.extend({
          weapons: 2,
          turn: function(direction) {
            this.super('turn', direction);
            this.super('accelerate');
          },
          fire: function() {
            return 'ratatata x ' + this.weapons;
          }
        })

        this.seafire = this.spitfire.extend({
          weapons: 4,
          accelerate: function() {
            this.super('accelerate');
            this.speed += 2;
          }
        })
      }

      beforeEach(function() {
        cdb.decorators.super(Backbone.Model);
        getMocks.apply(this);
      });

      it("Should be able to add super method ", function() {
          expect(Backbone.Model.prototype.super).toBeTruthy();
      });

      it("Should be able to call a method from a parent class", function() {
        var plane = new this.spitfire();
        plane.turn('L');
        expect(plane.heading).toEqual(11);
        expect(plane.speed).toEqual(10)
      });

      it("Should be able to use parent using own properties without infinitelooping", function() {
        var plane = new this.seafire();
        var attack = plane.fire();
        expect(attack).toEqual('ratatata x 4');
      })

      it("Should be able to use grandparent method when the parent is not defined", function(){
        var plane = new this.seafire();
        plane.accelerate();
        expect(plane.speed).toEqual(12);
      })

  });

});

