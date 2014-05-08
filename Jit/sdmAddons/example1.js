/*global $jit*/
/*global document*/
/*global Image*/

var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem) 
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};

// SDM Loop edge type:
$jit.ForceDirected.Plot.EdgeTypes.implement({
  'loop': {
    'render': function(adj, canvas) {
      var from = adj.nodeFrom.pos.getc(true);
      var to_x = from.x;
      var to_y = from.y - 20;
      
      var vect = new $jit.Complex(to_x - from.x, to_y - from.y);
      vect.$scale(13 / vect.norm());
      var intermediatePoint = new $jit.Complex(to_x - vect.x, to_y - vect.y),
        normal = new $jit.Complex(-vect.y / 2, vect.x / 2),
        v1 = intermediatePoint.add(normal),
        v2 = intermediatePoint.$add(normal.$scale(-1));
      
      var ctx = canvas.getCtx();
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(from.x + 20, from.y);
      ctx.stroke();
      ctx.lineTo(from.x + 20, from.y + 20);
      ctx.stroke();
      ctx.lineTo(from.x, from.y + 20);
      ctx.stroke();
      ctx.lineTo(from.x, from.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y + 25);
      ctx.lineTo(v2.x, v2.y + 25);
      ctx.lineTo(to_x, to_y + 25);
      ctx.closePath();
      ctx.fill();
    }
  }
});

// SDM Image node type
$jit.ForceDirected.Plot.NodeTypes.implement({
  'image': {
    'render': function(node, canvas) {
      var ctx = canvas.getCtx();
      var pos = node.pos.getc(true);
      if(node.getData('image') !== 0) {
        var img = node.getData('image');
        ctx.drawImage(img, pos.x-8, pos.y-15);
      }
    },
    'contains': function(node, pos) {
      var npos = node.pos.getc(true);
      var dim = node.getData('dim');
      return this.nodeHelper.circle.contains(npos, pos, dim);
    }
  }
});

// SDM double_arrow type from: https://groups.google.com/forum/#!topic/javascript-information-visualization-toolkit/a-auKnTkHJc
$jit.ForceDirected.Plot.EdgeTypes.implement({
  'double_arrow': {
    'render': function(adj, canvas) {
      var from = adj.nodeFrom.pos.getc(true),
        to = adj.nodeTo.pos.getc(true),
        dim = adj.getData('dim'),
        ctx = canvas.getCtx(),
        vect = new $jit.Complex(to.x - from.x, to.y - from.y);
      
      vect.$scale(dim / vect.norm());
      // Needed for drawing the first arrow
      var intermediatePoint = new $jit.Complex(to.x - vect.x, to.y - vect.y),
        normal = new $jit.Complex(-vect.y / 2, vect.x / 2),
        v1 = intermediatePoint.add(normal),
        v2 = intermediatePoint.$add(normal.$scale(-1));
      
      var vect2 = new $jit.Complex(to.x - from.x, to.y - from.y);
      vect2.$scale(dim / vect2.norm());
      // Needed for drawing the second arrow
      var intermediatePoint2 = new $jit.Complex(from.x + vect2.x, from.y + vect2.y),
        normal2 = new $jit.Complex(-vect2.y / 2, vect2.x / 2),
        v12 = intermediatePoint2.add(normal2),
        v22 = intermediatePoint2.$add(normal2.$scale(-1));
      
      // Drawing the double arrow on the canvas, first the line, then the ends
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(v1.x, v1.y);
      ctx.lineTo(v2.x, v2.y);
      ctx.lineTo(to.x, to.y);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(v12.x, v12.y);
      ctx.lineTo(v22.x, v22.y);
      ctx.lineTo(from.x, from.y);
      ctx.closePath();
      ctx.fill();
    }
  }
});
// End double_arrow code

function getParameterByName(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
  results = regex.exec(document.location.search);
  
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function init(){
  //TODO - MGROVES MODIFIED
  // init data
  var json = [];
  var historyCookie = getParameterByName("historyCookie");
  var hierarchyCookie = getParameterByName("hierarchyCookie");
  if(historyCookie !== null && hierarchyCookie !== null) {
    historyCookie = JSON.parse(historyCookie);
    hierarchyCookie = JSON.parse(hierarchyCookie);
    
    var dict = {};
    for(var key in historyCookie) {
      if(historyCookie.hasOwnProperty(key)) {
        var obj = {};
        obj.adjacencies = [];
        obj.id = key;
        obj.name = historyCookie[key];
        
        obj.data = {};
        obj.data.$type = "image";
        obj.data.$dim = 16;
        obj.data.$url = "/images/icons/fugue/icons/16x16/document-pdf.png";
        dict[key] = obj;
      }
    }
    
    for(var key2 in hierarchyCookie) {
      if(hierarchyCookie.hasOwnProperty(key2)) {
        var obj2 = dict[key2];
        if(obj2 === null || obj2 === undefined) {
          obj2 = {};
          obj2.adjacencies = [];
          obj2.id = key2;
          obj2.name = key2;
          dict[key2] = obj2;
        }
        
        var array = hierarchyCookie[key2];
        for(var i = 0; i < array.length; ++i) {
          // Special case for self-references
          if(array[i] === key2) {
            var adj = {};
            adj.nodeTo = key2;
            adj.nodeFrom = key2;
            adj.data = {};
            adj.data.$type = "loop";
            obj2.adjacencies.push(adj);
          } else {
            obj2.adjacencies.push(array[i]);
          }
        }
      }
    }
    
    for(var key3 in dict) {
      if(dict.hasOwnProperty(key3)) {
        json.push(dict[key3]);
      }
    }
  }
  // end
  
  // init ForceDirected
  var fd = new $jit.ForceDirected({
    //id of the visualization container
    injectInto: 'infovis',
    //Enable zooming and panning
    //by scrolling and DnD
    Navigation: {
      enable: true,
      //Enable panning events only if we're dragging the empty
      //canvas (and not a node).
      panning: 'avoid nodes',
      zooming: 10 //zoom speed. higher is more sensible
    },
    // Change node and edge styles such as
    // color and width.
    // These properties are also set per node
    // with dollar prefixed data-properties in the
    // JSON structure.
    Node: {
      overridable: true
    },
    Edge: {
      overridable: true,
      color: '#23A4FF',
      lineWidth: 0.4,
      //TODO - MGROVES MODIFIED
      type: 'arrow'
    },
    //Native canvas text styling
    Label: {
      type: labelType, //Native or HTML
      size: 10,
      style: 'bold'
    },
    //Add Tips
    Tips: {
      enable: true,
      onShow: function(tip, node) {
        //count connections
        var count = 0;
        node.eachAdjacency(function() { count++; });
        //display node info in tooltip
        tip.innerHTML = "<div class=\"tip-title\">" + node.name + "</div>" + "<div class=\"tip-text\"><b>connections:</b> " + count + "</div>";
      }
    },
    // Add node events
    Events: {
      enable: true,
      type: 'Native',
      //Change cursor style when hovering a node
      onMouseEnter: function() {
        fd.canvas.getElement().style.cursor = 'move';
      },
      onMouseLeave: function() {
        fd.canvas.getElement().style.cursor = '';
      },
      //Update node positions when dragged
      onDragMove: function(node, eventInfo, e) {
          var pos = eventInfo.getPos();
          node.pos.setc(pos.x, pos.y);
          fd.plot();
      },
      //Implement the same handler for touchscreens
      onTouchMove: function(node, eventInfo, e) {
        $jit.util.event.stop(e); //stop default touchmove event
        this.onDragMove(node, eventInfo, e);
      },
      //Add also a click handler to nodes
      onClick: function(node) {
        if(!node) { return; }
        // Build the right column relations list.
        // This is done by traversing the clicked node connections.
        var html = "<h4>" + node.name + "</h4><b> connections:</b><ul><li>",
            list = [];
        node.eachAdjacency(function(adj){
          list.push(adj.nodeTo.name);
        });
        //append connections information
        $jit.id('inner-details').innerHTML = html + list.join("</li><li>") + "</li></ul>";
      }
    },
    //Number of iterations for the FD algorithm
    iterations: 200,
    //Edge length
    levelDistance: 130,
    // Add text to the labels. This method is only triggered
    // on label creation and only for DOM labels (not native canvas ones).
    onCreateLabel: function(domElement, node){
      domElement.innerHTML = node.name;
      var style = domElement.style;
      style.fontSize = "0.8em";
      style.color = "#ddd";
    },
    // Change node styles when DOM labels are placed
    // or moved.
    onPlaceLabel: function(domElement, node){
      var style = domElement.style;
      var left = parseInt(style.left);
      var top = parseInt(style.top);
      var w = domElement.offsetWidth;
      style.left = (left - w / 2) + 'px';
      style.top = (top + 10) + 'px';
      style.display = '';
    }
  });
  
  function loadImages() {
    fd.graph.eachNode(function(node) {
      if(node.getData('type') === 'image') {
        var img = new Image();
        img.addEventListener('load', function() {
          node.setData('image', img); // store this image object in node
        }, false);
        
        img.src = node.getData('url');
      }
    });
  }
  
  // load JSON data.
  fd.loadJSON(json);
  
  // load images in node
  loadImages();
  
  // compute positions incrementally and animate.
  fd.computeIncremental({
    iter: 40,
    property: 'end',
    onStep: function(perc){
      Log.write(perc + '% loaded...');
    },
    onComplete: function(){
      Log.write('done');
      fd.animate({
        modes: ['linear'],
        transition: $jit.Trans.Elastic.easeOut,
        duration: 2500
      });
    }
  });
  // end
}
