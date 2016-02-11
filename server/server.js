Meteor.startup(function () {
  if (!Colors.findOne()){
  	var inits = [
      "#053873","#83AEDE","#44E3E0","#A7F2F1",
      "#44E37E","#93F5B7","#488C29","#B6C934",
      "#F0EA3A","#EDBE32","#E37D24","#F5C8AB",
      "#FFB3B3","#FF5E5E","#FF0000","#A80000"
    ];

    for(var i = 0; i < 16; i++) {
  		Colors.insert({color: inits[i]});	
  	} 
  }
  if(!CanvasContext.findOne()) {
  	CanvasContext.insert({initialTool: "line"});
  }
});

Meteor.publish("colors", function() {
	return Colors.find({});
});

Meteor.publish("pointsCollection", function() {
	return Points.find({});
})

Meteor.publish("canvasContext", function() {
	return CanvasContext.find({});
})