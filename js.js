var SIZE   = 350;
var WIDTH  = SIZE * 5/4;
var CENTER = WIDTH/2;
var RADIUS = SIZE/2;
var ZOOM   = 6;
var ARROW  = 1;

function paintTarget(s, radius, cx, cy) {
    var cs = {cx:cx, cy:cy};
    var size = radius*2;

    var COLORS = ["#ccc", "#000", "#00f", "#f00", "#ff0"];
    for (var i=0 ; i<5; i++) {
        var r = size - i*size/5;
        s.circle(r).attr({fill: COLORS[i]}).attr(cs);
    }

    s.circle(size/16).fill('none').stroke({color:"#000"}).attr(cs);
    for (var i=0 ; i<10; i++) {
        var color = "#000";
        if (i>1 && i<5) {
            color = "#fff";
        }
        var r = size - i*size/10;
        s.circle(r).fill('none').stroke({color:color}).attr(cs);
    }
}

var svg = SVG().addTo('div#canvas').size(WIDTH,WIDTH);
var draw = svg.group().transform({scale: 1});
var rect = draw.rect(WIDTH, WIDTH).attr({ fill: "#f46" });

paintTarget(draw, RADIUS, CENTER, CENTER);


var s = SVG().addTo('div#canvas').size(WIDTH,WIDTH);
s.rect(WIDTH,WIDTH).attr({fill:"#f46"});
var big = s.group();
var bigC = [CENTER,CENTER];

paintTarget(big, RADIUS*ZOOM, CENTER, CENTER);

s.line(CENTER,0,CENTER,WIDTH).stroke({color:'black', width:2});
s.line(0,CENTER,WIDTH,CENTER).stroke({color:'black', width:2});
s.line(CENTER+20,CENTER-20,CENTER-20,CENTER+20).stroke({color:'white', width:2});
s.line(CENTER-20,CENTER-20,CENTER+20,CENTER+20).stroke({color:'white', width:2});


var crosshair = draw.group().transform({translateX: 50, translateY: 50});
crosshair.line(-SIZE/2,0,SIZE/2,0).stroke({color:'black', width: 2});
crosshair.line(0,-SIZE/2,0,SIZE/2).stroke({color:'black', width: 2});
var boxSize = WIDTH/ZOOM;
var crossbox = crosshair.group().transform({translateX: -boxSize/2, translateY: -boxSize/2});
crossbox.rect(boxSize,boxSize).fill("none").stroke({color:'black', width:1});

var ontop = draw.rect(WIDTH,WIDTH).attr({'fill-opacity':0});

var crosshairMove = function(e) {
    var scoreElem = document.getElementById('score');
    e.preventDefault();
    e.stopPropagation();
    var off = document.getElementsByTagName('svg')[0].getBoundingClientRect();
    //var off = e.target.getBoundingClientRect();
    var x = -off.x;
    var y = -off.y;

    if ( e.type == 'touchmove' ) {
        var t = e.changedTouches[0];
        x += t.clientX;
        y += t.clientY;
    }
    else if (e.type == 'mousemove') {
        x += e.x;
        y += e.y;
    }

    crosshair.transform({translateX: x, translateY: y});
    var dist = Math.sqrt( (CENTER - x)**2 + (CENTER - y)**2);
    var size_of_one_segment = SIZE/20;
    var score = 10 - Math.floor(dist/size_of_one_segment);
    if (score <= 0) {
        score = 0;
    }
    scoreElem.innerText = score;

    var diff = [ bigC[0]*ZOOM - x*ZOOM, bigC[1]*ZOOM - y*ZOOM ];
    bigC = [x, y];

    big.translate(diff[0], diff[1]);
    //var big = s.group();
    //paintTarget(big, 800, 500, 500);
};

var clicker = function(e) {
    e.preventDefault();
    e.stopPropagation();
    //var off = e.target.getBoundingClientRect();
    var off = document.getElementsByTagName('svg')[0].getBoundingClientRect();
    var x = -off.x;
    var y = -off.y;

    if ( e.type == 'touchend' ) {
        var t = e.changedTouches[0];
        x += t.clientX;
        y += t.clientY;
    }
    else if (e.type == 'click') {
        x += e.x;
        y += e.y;
    }

    var r = draw.circle(10).fill('white').stroke({color:'black',width:2}).attr({cx:x,cy:y});

    var bx = (x-CENTER)*ZOOM + CENTER;
    var by = (y-CENTER)*ZOOM + CENTER;
    big.circle(10*ZOOM/2).fill('white').stroke({color:'black',width:2}).attr({cx:bx,cy:by});



    var dist = Math.sqrt( (CENTER - x)**2 + (CENTER - y)**2);
    var size_of_one_segment = SIZE/20;
    var score = 10 - Math.floor(dist/size_of_one_segment);
    if (score <= 0) {
        score = 0;
    }
    var tbl = document.getElementById('table');
    var row = document.createElement('tr');
    var c1  = document.createElement('td');
    c1.innerText = ARROW++;
    row.appendChild(c1);
    var c1  = document.createElement('td');
    c1.innerText = score;
    row.appendChild(c1);
    c2 = document.createElement('td');
    c2.innerText = Math.floor( 100*(x-CENTER)/RADIUS );
    row.appendChild(c2);
    c3 = document.createElement('td');
    c3.innerText = Math.floor( 100*(y-CENTER)/RADIUS );
    row.appendChild(c3);
    tbl.appendChild(row);
}

svg.on(['mousemove', 'touchmove'], crosshairMove);
svg.on(['click', 'touchend'], clicker);
