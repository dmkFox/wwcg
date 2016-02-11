
Meteor.subscribe("colors");
Meteor.subscribe("pointsCollection");
Meteor.subscribe("canvasContext");


Router.configure({
  layoutTemplate: 'ApplicationLayout'
});
// specify the top level route, the page users see when they arrive at the site
Router.route('/', function () {
  //console.log("rendering root /");
  this.render("landing_nav", {to:"header"});
  this.render("landing_page", {to:"main"});  
});

Router.route('/canvas', { loadingTemplate: "loading", 
  waitOn: function() {
    return Meteor.subscribe('colors');
  },
  action: function () {
    this.render("canvas_nav", {to:"header"});
    this.render("wall", {to:"main"});
  }
});

var canvas;

// we use these for drawing more interesting shapes
var lastX=-1;
var lastY=-1;

var thickness = 3;

var resetLastPoint = function() {
  lastX = -1;
  lastY = -1;
}

var markPoint = function(event) {
  /*
    The idea is to take the mouse location, offset that so that it gives
    us a pure canvas location, scale that based on the current canvas size to 
    match the location in a static size canvas (the virtual DB data canvas) and then
    create a data item based on the selected drawing tool and brush size. 

    The virtual canvas scaling is necessary because the user draws on a 
    client-side canvas, the size of which is based on the client 
    screen/viewport size. This requires scaling both when entering data in to
    the DB (client -> virtual canvas scaling) and when updating the client based 
    on DB changes (virtual canvas -> client scaling).

    The data item is first passed individually to the quick-draw method 
    corresponding to the selected drawing tool for immediate client-side 
    drawing. Then the same data item is inserted to DB using the meteor method.

    The SVG elements are not duplicated when the database update tries to draw 
    over the client-only quick-draw because the d3 data-join is created based 
    on the data item attributes rather than the DB id (no new SVG elements appended
    when the attributes match).
  */

  var drawingModule = Modules.client.drawing;

  var offset = $('#canvas').offset();

  var canvasX = -1;
  var canvasY = -1;

  //record current coordinates, for touch the scroll position might not be automatically included
  //in page coordinates and will have to be calculated manually
  if(event.originalEvent.touches) {
    if(event.originalEvent.touches.length > 1) return;
    canvasX = event.originalEvent.touches[0].clientX - offset.left + $(window).scrollLeft();
    canvasY = event.originalEvent.touches[0].clientY - offset.top + $(window).scrollTop();

  } else {
    canvasX = event.pageX - offset.left ;
    canvasY = event.pageY - offset.top; 
  }

  if(canvasX < 0 || canvasY < 0) {
    return;
  }

  //get tool attributes from session
  var tool = Session.get("drawingTool");
  var strokeColor = Session.get("strokeColor");

  //if previous x,y was not an actual point on canvas, mark this point as last for object creation
  if (lastX <= 0) {
    lastX = canvasX;
    lastY = canvasY;
    //no use drawing a pencil line that start and end in same position
    if(tool == "line" ) {
      return;
    }
  }

  //scale current coordinates to DB canvas scale
  var currentX = drawingModule.xToDBScale(canvasX);
  var currentY = drawingModule.yToDBScale(canvasY);

  lastX = drawingModule.xToDBScale(lastX);
  lastY = drawingModule.yToDBScale(lastY);

  //thickness between 1-10
  var currentThickness = Math.max(1, Math.min(10, thickness));

  

  if(!tool) return;
  if(tool == "line") {
    var linePoint = {
      type: tool,
      x: currentX,
      y: currentY,
      x1: lastX,
      y1: lastY,
      width: currentThickness,
      color: strokeColor,
      createdOn: new Date()
    };
    canvas.quickDrawLine([linePoint]);
    Meteor.call("insertPoint", linePoint);
   
  } else if(tool == "round") {
    var roundPoint = {
      type: tool,
      x: currentX,
      y: currentY,
      r: currentThickness,
      color: strokeColor,
      createdOn: new Date()
    };
    canvas.quickDrawRound([roundPoint]);
    Meteor.call("insertPoint", roundPoint);
  } else if(tool == "rect") {
    var rectPoint = {
      type: "line",
      x: currentX - currentThickness/2 ,
      y: currentY,
      x1: lastX + currentThickness/2 ,
      y1: lastY ,
      width: currentThickness,
      color: strokeColor,
      createdOn: new Date()
    };
    canvas.quickDrawLine(rectPoint);
    Meteor.call("insertPoint", rectPoint);
    
    //reset position to discontinue line
    canvasX = -1;
    canvasY = -1;

  } else if(tool == "calligraphy") {
    var calligPoint = {
      type: "line",
      x: currentX - currentThickness+2,
      y: currentY - 6,
      x1: lastX + currentThickness+2,
      y1: lastY + 6,
      width: currentThickness/2,
      color: strokeColor,
      createdOn: new Date()
    }
    canvas.quickDrawLine([calligPoint]);
    Meteor.call("insertPoint", calligPoint);
    
    //reset position to discontinue line
    canvasX = -1;
    canvasY = -1;
  }

  //after object creation, update last coordinates
  lastX = canvasX;
  lastY = canvasY;
  
}

/** TEMPLATES **/


/*Nav_buttons*/

Template.nav_buttons.helpers({
   "selectedColor": function() {
    return Session.get("strokeColor");
  }
});

Template.nav_buttons.events({
  "click #exportButton": function() {
    Modules.client.svgexport.exportSvgAsPng();
  },
  
  "click #clearButton": function (event) {
    Meteor.call('clearCanvas', function() {
      canvas.clear();
    });
    resetLastPoint();
  },
  
  "changeColor": function(event) {
    if(!event) return;
    var newColor = event.color.toHex();
    Session.set("strokeColor",newColor);
  },
  
  "change .thicknessInput": function () {
    var value = $(".thicknessInput").val();
    if(value) {
      thickness = value;
    }
  },

  "change .toolSelect": function() {
    resetLastPoint();
    var value = $(".toolSelect").val();
    if(value) {
      Session.set("drawingTool", value);
    }
  }
});

Template.nav_buttons.onRendered(function() {
  var startingColor = Colors.findOne();
  $(".selectedColor").colorpicker();
  $(".selectedColor").on("click", function() {
    resetLastPoint();
  })

  Tracker.autorun(function() {
    var color = Session.get("strokeColor");
    $(".selectedColor").colorpicker("setValue", color);
  })

  if(startingColor) {    
    Session.set("strokeColor", startingColor.color);
  }
});

/*Palette*/

Template.palette.helpers({
  "colors": function() {
    var colors = Colors.find().fetch();
    if(colors) {
      return colors;
    }
  }
});

Template.palette.events({
  "click li.colorItem": function(event) {
    Session.set("strokeColor",this.color);
    resetLastPoint();
  }
})


/*Canvas*/

Template.canvas.events({
  'touchstart #svgCanvas': function(event) {
    if(event && event.originalEvent.touches.length == 1) {
      resetLastPoint();
      Session.set('draw', true);
    }
  },

  'touchend #svgCanvas': function(event) {
    if(event) {
      Session.set('draw', false);
      resetLastPoint();
    }
  },

  'touchmove #svgCanvas': function(event) {
    if(event) {
      if (Session.get('draw')) {
        markPoint(event);
      }
    }
  },

  'gesturestart #svgCanvas': function(event) {
    if(event) {
      Session.set('draw', false);
    }
  },

  'click #svgCanvas': function (event) {
    if(event && event.button === 0) {
      markPoint(event);
    }
      
  },
  'mousedown #svgCanvas': function (event) {
    if(event && event.button === 0) {
      resetLastPoint();
      Session.set('draw', true);

    }

  },
  'mouseup': function (event) {
    if(event && event.button === 0) {
      Session.set('draw', false);
      resetLastPoint();
    }

  },
  'mousemove #svgCanvas': function (event) {
    if (Session.get('draw')) {
      markPoint(event);
    }
  }
});

Template.canvas.onRendered(function() {
  var currentWidth = $("#canvas").innerWidth();
  Modules.client.drawing.setActualWidth(currentWidth) ;
  Modules.client.drawing.setActualHeight(currentWidth / Modules.client.drawing.getRatio());

  Tracker.autorun(function() {
    var context = CanvasContext.findOne();
    if(context) {
      $("toolSelect").val(context.initialTool);
      Session.set("drawingTool", context.initialTool);
  }  
  });
  
});

/*colorItem*/

Template.colorItem.events({
  
  "click .colorItem": function(event) {
    var self = this;
  }
})
Template.colorItem.onRendered(function() {
  var self = $(this.firstNode); 
  var myColor = this.data.color;
  //self.colorpicker({color: myColor});//apparently bugged in current release
  self.on("click", function(event) {
    $(".colorItem").removeClass("active");
    $(this).addClass("active");
    Session.set("strokeColor", myColor);
    resetLastPoint();  
  })
  
});

/*Wall*/

Template.wall.onRendered(function() {
  canvas = new Modules.client.drawing.Canvas();
  
  /*This links the canvas drawing to data updates*/
  Deps.autorun( function() {
    var data = Points.find({},{$sort: { createdOn: 1}}).fetch();
    if (canvas) {
      canvas.setData(data);
      canvas.draw();
    }
  });

  /*A necessary addition to clear drawing mode beyond immediate template context*/
  $(window).on("mouseup", function() {
    Session.set("draw", false);
    resetLastPoint();
  })

})



