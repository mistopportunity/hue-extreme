function rgbToHex(r,g,b) {
    return "#" + ((r << 16) | (g << 8) | b).toString(16);
}
function getScrambleMap(size,callback) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute("width",size);
    canvas.setAttribute("height",size);
    var context = canvas.getContext("2d");
    var image = new Image();
    image.onload = function() {
        console.log(image.width,image.height);
        context.drawImage(image,0,0,size,size,0,0,size,size);
        var contextData = context.getImageData(0,0,size,size).data;
        function getColor(x,y) {
            var index = (y * size + x) * 4;
            return rgbToHex(
                contextData[index],
                contextData[index+1],
                contextData[index+2]
            );
        }
        var colorID = 0;
        var map = new Array(size);
        var hashMap = new Array(size);
        var colorLookup = {};
        for(var x = 0;x<size;x++) {
            const column = new Array(size);
            const hashColumn = new Array(size);
            for(var y = 0;y<size;y++) {
                var color = getColor(x,y);
                if(!colorLookup[color]) {
                    colorLookup[color] = colorID++;
                }
                hashColumn[y] = colorLookup[color];
                column[y] = color;
            }   
            hashMap[x] = hashColumn;
            map[x] = column;
        }
        callback({
            hashMap: hashMap,
            colorMap: map,
            colorLookup: colorLookup
        });
    };
    image.onerror = function() { 
        alert("An error happened when generating the puzzle :( Sorry");
    }
    image.src = "gradient.svg";
}

function you_win() {
    setTimeout(function(){
        alert("Wow! You actually managed to beat the puzzle?? You must be really good at this, have a lot of free time, or really like pain. Good job, though. Be sure to brag about this.");
    },1000);
}

(function(){
    var SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    var SWAP_COUNT = 300;
    var MATRIX_SIZE = 20;
    var INNER_DISTANCE = 0;

    var CLICK_PADDING = 0.1;
    var DOUBLE_CLICK_PADDING = CLICK_PADDING + CLICK_PADDING;

    var DOT_RADIUS = 0.1;

    var ADJUSTED_SIZE = MATRIX_SIZE + INNER_DISTANCE * (MATRIX_SIZE-1);

    function translateToSvgCoordinate(x,y,width,height) {
        return "" + x + " " + y + " " + width + " " + height;
    }

    function getSquare(x,y) {
        var square = document.createElementNS(SVG_NAMESPACE,"rect");
        square.setAttribute("x",x+(INNER_DISTANCE*x));
        square.setAttribute("y",y+(INNER_DISTANCE*y));
        square.setAttribute("width",1);
        square.setAttribute("height",1);
        if(x === 0 || x === MATRIX_SIZE-1) {
            square.puzzle_fixed = true;
        } else if(y === 0 || y === MATRIX_SIZE-1) {
            square.puzzle_fixed = true;
        }
        return square;
    }

    function getGridCircle(x,y) {
        var circle = document.createElementNS(SVG_NAMESPACE,"rect");
        circle.setAttribute("x",x+(INNER_DISTANCE*x)+0.5-DOT_RADIUS/2);
        circle.setAttribute("y",y+(INNER_DISTANCE*y)+0.5-DOT_RADIUS/2);
        circle.setAttribute("width",DOT_RADIUS);
        circle.setAttribute("height",DOT_RADIUS);
        circle.setAttribute("fill","black");
        return circle;
    }

    var svgElement = document.createElementNS(SVG_NAMESPACE,"svg");

    svgElement.setAttribute("width",ADJUSTED_SIZE);
    svgElement.setAttribute("height",ADJUSTED_SIZE);
    svgElement.setAttribute("viewBox",
        translateToSvgCoordinate(0,0,ADJUSTED_SIZE,ADJUSTED_SIZE)
    );

    var svgGroup = document.createElementNS(SVG_NAMESPACE,"g");

    var squareRegister = null;

    function modifyRectValue(rect,name,change) {
        var value = Number(rect.getAttribute(name));
        value += change;
        rect.setAttribute(name,value);
    }

    var validateBoard = function() {
        return false;
    }

    var completed = false;

    var svgMap = new Array(MATRIX_SIZE);

    function swapRects(x1,y1,x2,y2) {
        var square1 = svgMap[x1][y1];
        if(square1.puzzle_fixed) {
            return;
        }
        var square2 = svgMap[x2][y2];
        if(square2.puzzle_fixed) {
            return;
        }
        var color1 = square1.getAttribute("fill");
        square1.setAttribute("fill",square2.getAttribute("fill"));
        square2.setAttribute("fill",color1);
    }

    var panning = false;

    function processSquareClicked(square) {
        if(panning) {
            panning = false;
            return;
        }
        if(square.puzzle_fixed || panning) {
            return;
        }
        if(squareRegister) {
            modifyRectValue(squareRegister,"x",CLICK_PADDING);
            modifyRectValue(squareRegister,"y",CLICK_PADDING);
            modifyRectValue(squareRegister,"width",-DOUBLE_CLICK_PADDING);
            modifyRectValue(squareRegister,"height",-DOUBLE_CLICK_PADDING);
            var registerColor = squareRegister.getAttribute("fill");
            squareRegister.setAttribute("fill",square.getAttribute("fill"));
            square.setAttribute("fill",registerColor);
            squareRegister = null;
            if(!completed && validateBoard()) {
                completed = true;
                you_win();
            }
        } else {
            svgGroup.removeChild(square);
            svgGroup.appendChild(square);
            squareRegister = square;
            modifyRectValue(squareRegister,"x",-CLICK_PADDING);
            modifyRectValue(squareRegister,"y",-CLICK_PADDING);
            modifyRectValue(squareRegister,"width",DOUBLE_CLICK_PADDING);
            modifyRectValue(squareRegister,"height",DOUBLE_CLICK_PADDING);
        }
    }

    for(var y = 0;y<MATRIX_SIZE;y++) {
        var column = new Array(MATRIX_SIZE);
        for(var x = 0;x<MATRIX_SIZE;x++) {
            var square = getSquare(x,y);
            column[x] = square;
            (function(target){
                target.addEventListener("click",function() {
                    processSquareClicked(target);
                });
            })(square);
            svgGroup.appendChild(square);
            if(square.puzzle_fixed) {
                svgGroup.appendChild(getGridCircle(x,y));
            }
        }
        svgMap[y] = column;
    }

    svgElement.appendChild(svgGroup);
    document.body.appendChild(svgElement);

    var instance = panzoom(svgGroup,{
        zoomDoubleClickSpeed: 1
    });
    instance.on("panstart", function(e) {
        panning = true;
    });

    getScrambleMap(MATRIX_SIZE,function(scrambleMap){
        var hashMap = scrambleMap.hashMap;
        var colorMap = scrambleMap.colorMap;
        var colorLookup = scrambleMap.colorLookup;

        for(var x = 0;x<MATRIX_SIZE;x++) {
            for(var y = 0;y<MATRIX_SIZE;y++) {
                var square = svgMap[x][y];
                var color = colorMap[x][y];
                square.setAttribute("fill",color);
            }
        }

        validateBoard = function() {
            var isValid = true;
            for(var x = 0;isValid&&x<MATRIX_SIZE;x++) {
                for(var y = 0;isValid&&y<MATRIX_SIZE;y++) {
                    var color = svgMap[x][y].getAttribute("fill");
                    var colorHash = colorLookup[color];
                    isValid = colorHash === hashMap[x][y];
                }
            }
            return isValid;
        }

        for(var i = 0;i<SWAP_COUNT;i++) {
            swapRects(
                Math.floor(Math.random() * MATRIX_SIZE),
                Math.floor(Math.random() * MATRIX_SIZE),
                Math.floor(Math.random() * MATRIX_SIZE),
                Math.floor(Math.random() * MATRIX_SIZE)
            );
        }
    });
})();
