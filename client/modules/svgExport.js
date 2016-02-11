var exportHandler = function(){
 
  console.log(Pablo.support.download ? "Yey, your browser supports downloading svg as png!!" 
  	: "Seems your browser does not much care for SVG to PNG downloads. Pity, that.");

  var ua = window.navigator.userAgent;
  var edge = ua.indexOf("Edge/");
  var msie = ua.indexOf("MSIE ");
  var trident = ua.indexOf("Trident/");

  if(msie >= 0 || edge >= 0 || trident >= 0) {
  	alert("Looks like you are using a Microsoft browser. Unfortunately they do not support the used Export-function for SVG canvases. Please right click on the canvas and select \'Save picture as\' to download the picture. ");
  } else {
  	Pablo("svg").download("png", "wwc_export.png", function(result) {
    if(result.error) console.log("Export error" + result);
  	});
  		
  }

  
}

Modules.client.svgexport = {
  exportSvgAsPng: exportHandler
};