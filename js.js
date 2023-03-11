class Target {
    constructor(size=350, zoom=6, canvas='div#canvas') {
        this.SIZE   = size;
        this.WIDTH  = this.SIZE * 5/4;
        this.CENTER = this.WIDTH/2;
        this.RADIUS = this.SIZE/2;
        this.ZOOM   = zoom;
        this.ARROW  = 1;
        this.CANVAS = canvas;
    }

    // Just a setup function
    paintTargets() {
        console.log(this.CANVAS);
        var svg = SVG().addTo(this.CANVAS).size(this.WIDTH,this.WIDTH);
        var draw = svg.group().transform({scale: 1});
        var rect = draw.rect(this.WIDTH, this.WIDTH).attr({ fill: "#f46" });

        console.log(svg);

        this['target'] = {}
        this['target']['node'] = svg.node;
        this['target']['group'] = draw;

        this._paintTarget(draw, this.RADIUS, this.CENTER, this.CENTER);

        // Create crosshair on small target
        var crosshair = draw.group().transform({translateX: this.WIDTH/2, translateY: this.WIDTH/2});
        crosshair.line(-this.SIZE/2,0,this.SIZE/2,0).stroke({color:'black', width: 2});
        crosshair.line(0,-this.SIZE/2,0,this.SIZE/2).stroke({color:'black', width: 2});
        var boxSize = this.WIDTH/this.ZOOM;
        var crossbox = crosshair.group().transform({translateX: -boxSize/2, translateY: -boxSize/2});
        crossbox.rect(boxSize,boxSize).fill("none").stroke({color:'black', width:1});

        this['_crosshair'] = crosshair;

        svg.on(['mousemove', 'touchmove'], (e) => this.onCrosshairMove(e));
        svg.on(['click', 'touchend'], (e) => this.onClick(e));

        var s = SVG().addTo(this.CANVAS).size(this.WIDTH,this.WIDTH);
        s.rect(this.WIDTH,this.WIDTH).attr({fill:"#f46"});
        var big = s.group();
        var bigC = [this.CENTER,this.CENTER];

        this['zoomed'] = {};
        this['zoomed']['node'] = s.node;
        this['zoomed']['center'] = bigC;
        this['zoomed']['group']  = big;

        this._paintTarget(big, this.RADIUS*this.ZOOM, this.CENTER, this.CENTER);
        // Center cross on zoomed target
        s.line(this.CENTER,0,this.CENTER,this.WIDTH).stroke({color:'black', width:2});
        s.line(0,this.CENTER,this.WIDTH,this.CENTER).stroke({color:'black', width:2});
        s.line(this.CENTER+20,this.CENTER-20,this.CENTER-20,this.CENTER+20).stroke({color:'white', width:2});
        s.line(this.CENTER-20,this.CENTER-20,this.CENTER+20,this.CENTER+20).stroke({color:'white', width:2});
    }

    onCrosshairMove(e) {
        var scoreElem = document.getElementById('score');
        e.preventDefault();
        e.stopPropagation();

        var [x,y] = this.eventCoordinate(e);

        this['_crosshair'].transform({translateX: x, translateY: y});
        var dist = Math.sqrt( (this.CENTER - x)**2 + (this.CENTER - y)**2);
        var size_of_one_segment = this.SIZE/20;
        var score = 10 - Math.floor(dist/size_of_one_segment);
        if (score <= 0) {
            score = 0;
        }
        scoreElem.innerText = score;

        var bigC = this['zoomed']['center'];
        var diff = [ bigC[0]*this.ZOOM - x*this.ZOOM, bigC[1]*this.ZOOM - y*this.ZOOM ];
        this['zoomed']['center'] = [x,y];

        this['zoomed']['group'].translate(diff[0], diff[1]);
    }

    eventCoordinate(e) {
        var off = this['target']['node'].getBoundingClientRect();
        var x = -off.x;
        var y = -off.y;

        if ( e.type == 'touchend' || e.type == 'touchmove' ) {
            var t = e.changedTouches[0];
            x += t.clientX;
            y += t.clientY;
        }
        else if ( e.type == 'click' || e.type == 'mousemove' ) {
            x += e.x;
            y += e.y;
        }
        return [x,y];
    }

    onClick(e) {
        e.preventDefault();
        e.stopPropagation();
        //var off = e.target.getBoundingClientRect();
        var [x,y] = this.eventCoordinate(e);

        var bx = (x-this.CENTER)*this.ZOOM + this.CENTER;
        var by = (y-this.CENTER)*this.ZOOM + this.CENTER;

        var hit = {};

        var r = this.target.group.circle(10).fill('white').stroke({color:'black',width:2}).attr({cx:x,cy:y});
        this.zoomed.group.circle(10*this.ZOOM/2).fill('white').stroke({color:'black',width:2}).attr({cx:bx,cy:by});

        var dist = Math.sqrt( (this.CENTER - x)**2 + (this.CENTER - y)**2);
        var size_of_one_segment = this.SIZE/20;
        var score = 10 - Math.floor(dist/size_of_one_segment);
        if (score <= 0) {
            score = 0;
        }
        var tbl = document.getElementById('table');
        var row = document.createElement('tr');
        var c1  = document.createElement('td');
        c1.innerText = this.ARROW++;
        row.appendChild(c1);
        var c1  = document.createElement('td');
        c1.innerText = score;
        row.appendChild(c1);
        var c2 = document.createElement('td');
        c2.innerText = Math.floor( 100*(x-this.CENTER)/this.RADIUS );
        row.appendChild(c2);
        var c3 = document.createElement('td');
        c3.innerText = Math.floor( 100*(y-this.CENTER)/this.RADIUS );
        row.appendChild(c3);
        tbl.appendChild(row);
    }

    _paintTarget(s, radius, cx, cy) {
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
}

var t = new Target();
t.paintTargets();
