function getFBstatus(gl) {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  switch (status) {
    case gl.FRAMEBUFFER_COMPLETE:
      return 'FRAMEBUFFER_COMPLETE';
    case gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT:
      return 'FRAMEBUFFER_INCOMPLETE_ATTACHMENT';
    case gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT:
      return 'FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT';
    case gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS:
      return 'FRAMEBUFFER_INCOMPLETE_DIMENSIONS';
    case gl.FRAMEBUFFER_UNSUPPORTED:
      return 'FRAMEBUFFER_UNSUPPORTED';
    case gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE:
      return 'FRAMEBUFFER_INCOMPLETE_MULTISAMPLE';
    case gl.RENDERBUFFER_SAMPLES:
      return 'RENDERBUFFER_SAMPLES';
    default:
      return 'Unkown Framebuffer status';
  }
}

function getWebGLsupport(canvas) {
  var support = {
    webgl1: '?',
    OES_texture_float: '?',
    EXT_blend_minmax: '?',
    MAX_RENDERBUFFER_SIZE: '?',
    renderToFloat: '?'
  };

  var gl = canvas.getContext('webgl');
  if (!gl) {
    return support;
  } else {
    support.webgl1 = true;
  }

  var OES_texture_float = gl.getExtension("OES_texture_float");
  support.OES_texture_float = OES_texture_float ? true : false;


  var EXT_blend_minmax = gl.getExtension('EXT_blend_minmax');
  support.EXT_blend_minmax = EXT_blend_minmax ? true : false;

  support.MAX_RENDERBUFFER_SIZE = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);

  var aux1x1FB = gl.createFramebuffer();
  var aux1x1TEX = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, aux1x1TEX);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
    1, 1, 0, gl.RGBA, gl.FLOAT,
    null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.bindFramebuffer(gl.FRAMEBUFFER, aux1x1FB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, aux1x1TEX, 0);
  //Check FB completeness
  support.renderToFloat = getFBstatus(gl);
  return support;
}

module.exports = {
  getWebGLStats: function () {
    var testCanvas = document.createElement("canvas");
    var stats;
    testCanvas.style.position = 'absolute';
    testCanvas.style.top = '0';
    testCanvas.style.left = '0';
    testCanvas.style.zIndex = '-1';
    testCanvas.style.pointerEvents = 'none';
    document.body.appendChild(testCanvas);

    try {
      var support = getWebGLsupport(testCanvas);
      stats = JSON.stringify(support);
    } catch (error) {
      stats = error;
    } finally {
      return stats;
    }
  }
};
