


//the scales to map screen canvas to db canvas
var xToDBScale = d3.scale.linear();
var yToDBScale = d3.scale.linear();

//the scales to map db canvas to screen canvas
var xFromDBScale = d3.scale.linear();
var yFromDBScale = d3.scale.linear();

var actualWidth = 0;
var actualHeight = 0;

//fixed ratio of the image, necessary for scaling
var ratio = 2.25;
var maxHeight = 800;

//Canvas constructor
var Canvas = function() {
  var self = this;
  var svg;
  var data = [];
  
  var createSvg = function() {
    svg = d3.select('#canvas').append('svg').attr("id","svgCanvas");

    updateCanvasSize();
    rescale();

  };
    
  var updateCanvasSize = function() {
    if(!svg) return;

    //Measures the viewport and sizes the canvas so that we avoid overflow

    var verticalOffset = $(".quickPalette").outerHeight() + $(".navbar").outerHeight() + 20;
    var horizontalOffset = 20;
    var canvasHeight = Math.max(0,($(window).innerHeight()))  - verticalOffset;
    var canvasWidth = Math.max(0,($(window).innerWidth())) - horizontalOffset;

    actualWidth = Math.min(canvasHeight * ratio,canvasWidth);
    actualHeight = (actualWidth / ratio);
    
    var sdcanvas = d3.select("#canvas")
    sdcanvas.style("height", actualHeight +"px");
    sdcanvas.style("width", actualWidth +"px");

    svg
      .attr("width", actualWidth)
      .attr("height", actualHeight);
    
  }


  var rescale = function() {
    //calibrates the scales to adjust viewport sized canvas to static sized DB canvas
    
    xFromDBScale
      .domain([0,ratio*maxHeight])
      .range([0,actualWidth]);
    yFromDBScale
      .domain([0,maxHeight])
      .range([0,actualHeight]);

    xToDBScale
      .domain([0,actualWidth])
      .range([0,ratio*maxHeight]);
    yToDBScale
      .domain([0,actualHeight])
      .range([0,maxHeight]);
  }

  self.clear = function() {
    d3.select('svg').remove();
    createSvg();
  };

  createSvg();


  $(window).on("resize", function() {
    updateCanvasSize();
    rescale();

    self.clear();
    self.draw();
  });

  self.setData = function(newData) {
    data = newData;
  }

  self.quickDrawRound = function(data) {
    if(data.length < 1) { 
      return;
    }

    svg.selectAll('circle').data(data, function(d) {
      if(d.type != "round") return null;
      return "" + d.x + d.y + d.r + d.color;
    })
    .enter().append('circle')
      .attr('r', function(d) { return d.r; })
      .attr('cx', function (d) { return xFromDBScale(d.x); })
      .attr('cy', function (d) { return yFromDBScale(d.y); })
      .attr('stroke', function (d) { return d.color; })
      .attr('fill', function(d) { return d.color;})
      .attr("class", "drawing");

  }

  self.quickDrawLine = function(data) {
    if(data.length < 1) { 
      return;
    }
    svg.selectAll('line').data(data, function(d) 
      { 
        if(d.type != "line") return null;
        return "" + d.x + d.y + d.x1 + d.y1 + d.width + d.color;
      })
      .enter().append('line')
        .attr('x1', function (d) { return xFromDBScale(d.x); })
        .attr('y1', function (d) { return yFromDBScale(d.y); })
        .attr('x2', function (d) { return xFromDBScale(d.x1); })
        .attr('y2', function (d) { return yFromDBScale(d.y1); })
        .attr("stroke-width", function (d) { return d.width; })
        .attr("stroke", function (d) { return d.color; })
        .attr("stroke-linejoin", "round")
        .attr("class", "drawing");
    
  }

  self.draw = function() {
    if (data.length < 1) {
      self.clear();
      return;
    }
    if (svg) {
     var drawing = svg.selectAll(".drawing").data(data, function(d) {
        //the key function is based on properties, prevents redrawing of already quickdrawn items
        //that would not have a database id
        if(d.type == "round") {
          return "" + d.x + d.y + d.r + d.color;
        } else if(d.type == "line") {
          return "" + d.x + d.y + d.x1 + d.y1 + d.width + d.color;
        }
      });
      drawing.enter().append(function(d) {
        if(d.type == "round") {
          return document.createElementNS("http://www.w3.org/2000/svg", "circle");
        }
        if(d.type == "line"){
          return document.createElementNS("http://www.w3.org/2000/svg", "line");
        } 
      })
        .attr('r', function(d) { return (d.type == "round") ? d.r : null; })
        .attr('cx', function (d) { return (d.type == "round") ? xFromDBScale(d.x) : null; })
        .attr('cy', function (d) { return (d.type == "round") ? yFromDBScale(d.y) : null; })
        .attr("stroke", function (d) { return d.color })
        .attr('fill', function(d) { return (d.type == "round") ? d.color : null; })
        .attr('x1', function (d) { return (d.type == "line") ? xFromDBScale(d.x) : null})
        .attr('y1', function (d) { return (d.type == "line") ? yFromDBScale(d.y) : null })
        .attr('x2', function (d) { return (d.type == "line") ? xFromDBScale(d.x1) : null })
        .attr('y2', function (d) { return (d.type == "line") ? yFromDBScale(d.y1) : null })
        .attr("stroke-width", function (d) { return (d.type == "line") ? d.width : null })
        .attr("class", "drawing");
        
      } // end of the if(svg) statement
    }; // end of the canvas.draw function
} //end of the canvas function


/*Module interface*/

Modules.client.drawing =  {
  getActualHeight: function() {
    return actualHeight;
  },
  getActualWidth: function() {
    return actualWidth;
  },
  setActualHeight: function(value) {
    actualHeight = value;
  },
  setActualWidth: function(value) {
    actualWidth = value;
  },
  xFromDBScale: function(value) {
    return xFromDBScale(value);
  },
  yFromDBScale: function(value) {
    return yFromDBScale(value);
  },
  xToDBScale: function(value) {
    return xToDBScale(value);
  },
  yToDBScale: function(value) {
    return yToDBScale(value);
  },
  Canvas: Canvas
  ,
  getRatio: function() {
    return ratio;
  },
  getMaxHeight: function() {
    return maxHeight;
  }
}; 