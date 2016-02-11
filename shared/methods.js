Meteor.methods({
  "clearCanvas": function () {
    /*Unfortunately this creates quite a bit of data updates*/
    Points.remove({});
  },
  "insertPoint": function(pointData) {
  	if(pointData) {
  		Points.insert(pointData);
  	}
  }
});
