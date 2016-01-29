$(document).ready(function(){
	var statistics;
	var statistics2;
	var diagrammMinYear = 0;
	var diagrammMaxYear =2000;
	var maxItems = 1;
	var interval;
	var initialized = false;
	var rectArrayKeys = Array();
	var rectArrayIterator = 0;
	statistics = $("#statistics");
	statistics2 = $("#statistics2");
	$.ajax({
	url:'objects',
	method:'get'}		
	).success(function(data){
		console.log("Retrieving data success.");
		var pd = JSON.parse(data);
		statistics.append("<div>Retrieving data success.<br> "+pd.length+" Datasets</div><br>");
		createRects(pd);
		statistics.append('<span>Different time periods: '+rectArrayKeys.length+'</span><br>');
		statistics.append('<span>min Year: '+minYear+'<br>max Year: '+diagrammMaxYear+'<br>max Coins at one period: '+maxItems+'</span><br>');		
		drawDiagramm();
		
	});
	var rectArray = Array();

	var createRects = function(data){	
		for(var i = 0; i < data.length; i++){
			lookUpInArray(data[i]);
		}
	}
	var drawDiagramm = function(){	
		var canvas = document.getElementById('diagramm-canvas');
		canvas.width = Math.abs(minYear)+diagrammMaxYear;
		canvas.height = maxItems+100;
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0,0,diagrammMaxYear,maxItems+100);	
		rectArrayIterator = 0;
		interval = setInterval(drawRects,1000/150);
		for(var j = minYear; j < diagrammMaxYear; j+=100) {
			ctx.font = "12px Arial";
			ctx.fillText(j,j+Math.abs(minYear),maxItems+50);
			ctx.fillRect(j+Math.abs(minYear),maxItems+60,1,40);
		}
	}

	var drawRects = function() {
		if(rectArrayIterator < rectArrayKeys.length) {		
			var key = rectArrayKeys[rectArrayIterator];
			var r = rectArray[key];
			if(r !== undefined) {
				var canvas = document.getElementById('diagramm-canvas');
				var ctx = canvas.getContext("2d");
				ctx.fillRect(r.x+Math.abs(minYear),maxItems,r.width,-r.height);
			}
			rectArrayIterator++;
		} else {
			clearInterval(interval);
			rectArrayIterator = 0;
			initialized = true;
		}
	}

	var highlightRect = function(key){
		highlight(key,'lightblue');
		$('#'+key).css('background-color','rgba(25,25,25,0.5)');
	}

	var unhighlightRect = function(key){
		highlight(key,'black');
		$('#'+key).css('background-color','rgba(25,25,25,0)');
	}

	var highlight = function(key,color){
		if(!initialized) { return; }
		var canvas = document.getElementById('diagramm-canvas');
		var ctx = canvas.getContext("2d");
		var r = rectArray[key];
		ctx.fillStyle=color;
		ctx.fillRect(r.x+Math.abs(minYear),maxItems,r.width,-r.height);
		ctx.stroke();
	}

	var lookUpInArray = function(data){	
		if(parseInt(data.to,10) > new Date().getFullYear()) { 
			return; 
		}
		var height = 1;
		if($('#'+data.from+'-'+data.to).length) {
			height = rectArray[data.from+'-'+data.to].height+1;
			$('#'+data.from+'-'+data.to).html(""+data.from + " - " + data.to + ", "+rectArray[data.from+'-'+data.to].height+" coins");
		} else {
			rectArrayKeys[rectArrayIterator++] = data.from+'-'+data.to;
			statistics2.append('<span onmouseover="highlightRect(\''+data.from+'-'+data.to+'\')" onmouseout="unhighlightRect(\''+data.from+'-'+data.to+'\')" id="'+data.from+'-'+data.to+'">'+data.from + " - " + data.to + ", 1 coin</span><br>");
		}
		rectArray[data.from+'-'+data.to] = {x:data.from,y:1400,width:Math.abs(data.from-data.to),height:height};	
		minYear = minYear < parseInt(data.from,10) ? minYear : parseInt(data.from,10);
		diagrammMaxYear = diagrammMaxYear > parseInt(data.to,10) ? diagrammMaxYear : parseInt(data.to,10);	
		maxItems = maxItems > height ? maxItems : height;
	}
});
