
var PointRenderer = torque.renderer.Point;
var PixelRenderer = torque.renderer.Rectangle;

var BIRenderer = function(canvas, options) {
  PointRenderer.call(this, canvas, options);
}

torque.extend(BIRenderer.prototype, PointRenderer.prototype, {
   _renderTile: function(tile, key, frame_offset, sprites, shader, shaderVars) {
      if (!this._canvas) return;
      var ctx = this._ctx;
      var blendMode = PointRenderer.COMP_OP_TO_CANVAS[(shader.eval('comp-op')) || this.options.blendmode];
      if (blendMode) {
        ctx.globalCompositeOperation = blendMode;
      }
      if (this.options.cumulative && key > tile.maxDate) {
        //TODO: precache because this tile is not going to change
        key = tile.maxDate;
      }
      var tileMax = this.options.resolution * (this.TILE_SIZE/this.options.resolution - 1)
      var activePixels = tile.x.length;
      var anchor = this.options.resolution/2;
      if (activePixels) {
        var pixelIndex = tile.timeIndex[key];
        for(var p = 0; p < activePixels; ++p) {
            var posIdx = tile.renderDataPos[pixelIndex + p];
            var c = tile.renderData[pixelIndex + p];
            var sp = sprites[c];
            if (sp === undefined) {
               var mapping = tile.categories[key];
               if (mapping) {
                 c = mapping[c];
               }
               sp = sprites[c] = this.generateSprite(shader, c, torque.extend({ zoom: tile.z, 'frame-offset': frame_offset }, shaderVars));
            }
            if (sp) {
               var x = tile.x[posIdx]- (sp.width >> 1) + anchor;
               var y = tileMax - tile.y[posIdx] + anchor; // flip mercator
               ctx.drawImage(sp, x, y - (sp.height >> 1));
            }
        }
      }
    }
});


var BIPixelRenderer = function(canvas, options) {
  PixelRenderer.call(this, canvas, options);
}

torque.extend(BIPixelRenderer.prototype, PixelRenderer.prototype, {
   _renderTile: function(tile, key, frame_offset, sprites, shader, shaderVars) {
     if (!this._canvas) return;
      var ctx = this._ctx;
      var blendMode = PointRenderer.COMP_OP_TO_CANVAS[(shader.eval('comp-op')) || this.options.blendmode];
      if (blendMode) {
        ctx.globalCompositeOperation = blendMode;
      }
      var tileMax = this.options.resolution * (this.TILE_SIZE/this.options.resolution - 1)
      var activePixels = tile.x.length;
      var anchor = this.options.resolution/2;
      if (activePixels) {
        var pixelIndex = tile.timeIndex[key];
        for(var p = 0; p < activePixels; ++p) {
            var posIdx = tile.renderDataPos[pixelIndex + p];
            var c = tile.renderData[pixelIndex + p];
            var sp = sprites[c];
            if (sp === undefined) {
               var mapping = tile.categories[key];
               if (mapping) {
                 c = mapping[c];
               }
               sp = sprites[c] = this.generateSprite(shader, c, torque.extend({ zoom: tile.z, 'frame-offset': frame_offset }, shaderVars));
            }
            if (sp) {
              var x = tile.x[posIdx]- (sp.width >> 1) + anchor;
              var y = tileMax - tile.y[posIdx] + anchor; // flip mercator
              if (sp.fill_opacity > 0) {
                ctx.globalAlpha = sp.fill_opacity
                ctx.fillStyle = sp.color;
                ctx.fillRect(x, y, sp.width, sp.width);
              }
            }
        }
      }

    }
});
