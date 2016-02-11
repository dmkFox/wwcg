# wwcg
A proto for a data-driven collab with Meteor.

This application allows clients to collaborate on a shared scalable drawing canvas. 

In a nutshell:

The collaborative aspect is powered by Meteor's reactive data-model on top of MongoDB and Node. 
The user's mouse/touch interaction with the canvas is translated into SVG elements and added using d3. 
The SVG elements are saved in a database and reactively broadcast to all connected clients
to be rendered into corresponding SVG elements on their end. The client-side canvases are 
scaled according to the size of the user's viewport and the SVG data is mapped into a static-sized 
virtual DB canvas. This allows the users to see the entire canvas regardless of the screen size.
