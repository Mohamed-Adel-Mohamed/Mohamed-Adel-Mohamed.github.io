// hieroglyph rain — tinted glyph atlas falling behind the page
(function(){
  var cv = document.getElementById('hiero-rain');
  if (!cv) return;
  var ctx = cv.getContext('2d');

  var CELL = 40, COLS = 16, COUNT = 298;   // atlas layout
  var GLYPH = 30, GAP = 1.25;              // glyph size / column spacing
  var SPEED = [3, 8], TRAIL = [10, 20];    // rows per second / trail length
  var FPS = 30;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var rnd = function(a, b){ return a + Math.random() * (b - a); };
  var tinted = null, W, H, cols, rows, colW, streams, cells, last = 0, raf = 0;

  var img = new Image();
  img.src = new URL('../photos/hieroglyph-atlas.png', document.currentScript.src).href;

  function tint(){
    if (!img.width) return;
    var color = getComputedStyle(document.documentElement).getPropertyValue('--rain-color').trim() || '#d9a441';
    var o = document.createElement('canvas');
    o.width = img.width; o.height = img.height;
    var c = o.getContext('2d');
    c.drawImage(img, 0, 0);
    var d, p;
    try { d = c.getImageData(0, 0, o.width, o.height); } catch(e) { return; }
    p = d.data;
    var t = document.createElement('canvas').getContext('2d');
    t.fillStyle = color; t.fillRect(0, 0, 1, 1);
    var px = t.getImageData(0, 0, 1, 1).data;
    for (var i = 0; i < p.length; i += 4) {
      var a = p[i];
      p[i] = px[0]; p[i+1] = px[1]; p[i+2] = px[2]; p[i+3] = a;
    }
    c.putImageData(d, 0, 0);
    tinted = o;
  }

  function newStream(initial){
    return {
      y: initial ? rnd(-rows, rows) : rnd(-TRAIL[1], -2),
      v: rnd(SPEED[0], SPEED[1]),
      len: Math.round(rnd(TRAIL[0], TRAIL[1])),
      on: Math.random() > .25
    };
  }

  function resize(){
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = document.documentElement.clientWidth || window.innerWidth;
    H = document.documentElement.clientHeight || window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    colW = GLYPH * GAP;
    cols = Math.ceil(W / colW);
    rows = Math.ceil(H / GLYPH) + 1;
    cells = [];
    for (var i = 0; i < cols * rows; i++) cells.push((Math.random() * COUNT) | 0);
    streams = [];
    for (var c = 0; c < cols; c++) streams.push(newStream(true));
  }

  function draw(){
    if (!tinted) return;
    ctx.clearRect(0, 0, W, H);
    for (var c = 0; c < cols; c++) {
      var s = streams[c];
      if (!s.on) continue;
      var head = Math.floor(s.y);
      for (var k = 0; k < s.len; k++) {
        var r = head - k;
        if (r < 0 || r >= rows) continue;
        ctx.globalAlpha = k === 0 ? 1 : Math.pow(1 - k / s.len, 1.6);
        var i = cells[c * rows + r];
        var sx = (i % COLS) * CELL, sy = ((i / COLS) | 0) * CELL;
        ctx.drawImage(tinted, sx, sy, CELL, CELL, c * colW, r * GLYPH, GLYPH, GLYPH);
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(t){
    raf = requestAnimationFrame(frame);
    if (t - last < 1000 / FPS) return;
    var dt = Math.min((t - last) / 1000, .1);
    last = t;
    for (var c = 0; c < streams.length; c++) {
      var s = streams[c];
      s.y += s.v * dt;
      if (s.y - s.len > rows) {
        var fresh = newStream(false);
        fresh.on = Math.random() > .2;
        streams[c] = fresh;
      }
    }
    for (var n = 0; n < cols * 2; n++) {
      cells[(Math.random() * cells.length) | 0] = (Math.random() * COUNT) | 0;
    }
    draw();
  }

  function run(){
    cancelAnimationFrame(raf);
    if (reduce.matches || document.hidden) {
      if (reduce.matches) draw();
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  img.onload = function(){
    tint(); resize(); draw(); run();
    window.addEventListener('resize', function(){ resize(); draw(); });
    document.addEventListener('visibilitychange', run);
    reduce.addEventListener('change', run);
  };
})();
