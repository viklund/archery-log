class Hit {
    constructor(x, y, svgs) {
        this.svgs = svgs;
        this.x = x;
        this.y = y;

        let angle = Math.atan(y/x)*180/Math.PI;
        if ( x < 0 ) {
            angle += 180;
        }
        else if ( y < 0 ) {
            angle += 360;
        }
        this.angle = angle;

        this.dist = Math.sqrt(x**2 + y**2);
        this.score = Math.floor(11 - this.dist);
        if (this.score < 0) {
            this.score = 0;
        }

        this.time = Date.now();
    }

    jsonS() {
        return {
            x:     this.x,
            y:     this.y,
            dist:  this.dist,
            angle: this.angle,
            score: this.score,
            time:  this.score
        };
    }

    delete() {
        console.log("Delete");
        for (let s of this.svgs) {
            var p = s.node.parentNode;
            p.removeChild(s.node);
        }
    }
}

class Target {
    constructor(size=350, zoom=6, canvas='div#canvas') {
        this.SIZE      = size;
        this.WIDTH     = this.SIZE * 5/4;
        this.CENTER    = this.WIDTH/2;
        this.RADIUS    = this.SIZE/2;
        this.ZOOM      = zoom;
        this.ARROW     = 1;
        this.CANVAS    = canvas;
        this.callbacks = {};
    }

    on(event, callback) {
        if (event != 'hit') {
            console.log("Can't handle event " + event);
            return;
        }
        if (! (event in this.callbacks) ) {
            this.callbacks[event] = [];
        }
        this['callbacks'][event].push( callback );
    }

    run_callback(event, argument) {
        if (event in this.callbacks) {
            for (let cb of this.callbacks[event]) {
                cb(argument);
            }
        }
    }

    // Just a setup function
    paintTargets() {
        var svg = SVG().addTo(this.CANVAS).size(this.WIDTH,this.WIDTH);
        var draw = svg.group().transform({scale: 1});
        draw.rect(this.WIDTH, this.WIDTH).attr({ fill: "#f46" });

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
        var [x,y] = this.eventCoordinate(e);

        var bx = (x-this.CENTER)*this.ZOOM + this.CENTER;
        var by = (y-this.CENTER)*this.ZOOM + this.CENTER;

        var svg_target = this.target.group.circle(10).fill('white').stroke({color:'black',width:2}).attr({cx:x,cy:y});
        var svg_zoomed = this.zoomed.group.circle(10*this.ZOOM/2).fill('white').stroke({color:'black',width:2}).attr({cx:bx,cy:by});

        var hit = new Hit(
            10*(x - this.CENTER)/this.RADIUS,
            10*(this.CENTER - y)/this.RADIUS,
            [svg_target, svg_zoomed])

        this.run_callback('hit', hit);
    }

    _paintTarget(s, radius, cx, cy) {
        let cs = {cx:cx, cy:cy};
        let size = radius*2;

        let COLORS = ["#ccc", "#000", "#00f", "#f00", "#ff0"];
        for (let i=0 ; i<5; i++) {
            let r = size - i*size/5;
            s.circle(r).attr({fill: COLORS[i]}).attr(cs);
        }

        s.circle(size/16).fill('none').stroke({color:"#000"}).attr(cs);
        for (let i=0 ; i<10; i++) {
            let color = "#000";
            if (i>1 && i<5) {
                color = "#fff";
            }
            let r = size - i*size/10;
            s.circle(r).fill('none').stroke({color:color}).attr(cs);
        }
    }
}

var hits = [];

function deleteHit(n) {
    hits[n].delete();
}

var t = new Target();
t.paintTargets();
t.on('hit', (h) => {
    console.log(h);

    hits.push(h);

    var arrow = hits.length;

    var tbl = document.getElementById('table');
    var row = document.createElement('tr');
    var c1  = document.createElement('td');
    c1.innerText = arrow;
    row.appendChild(c1);

    c1 = document.createElement('td');
    c1.innerText = h.score;
    row.appendChild(c1);

    var c2 = document.createElement('td');
    c2.innerText = Math.floor( h.x );
    row.appendChild(c2);

    var c3 = document.createElement('td');
    c3.innerText = Math.floor( h.y );
    row.appendChild(c3);

    var c4 = document.createElement('td');
    var a = document.createElement('a');
    a.setAttribute('onclick', 'deleteHit(' + (arrow-1) + ')');
    a.innerText = "Delete";
    c4.appendChild(a);
    row.appendChild(c4);

    tbl.appendChild(row);

    fetch('http://localhost:8080/api/hits',
        {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(h.jsonS())
        }
    ).then( (r) => {
        if (!r.ok) {
            console.log("Post Error: " + r.status + " " + r.statusText);
        }
        console.log("Success!");
    });
});
