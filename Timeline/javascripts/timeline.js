$(document).ready(function() {
	$("#loading").show();
	$("#loading").css("top",((window.innerHeight)/2-100)+"px");
	$("#loading").css("left",((window.innerWidth)/2-100)+"px");
	$.getJSON("json/objects.json", function(json){
		Initialize(json);
	});
});

var zoomfactor = 1;
var panfactor = 0;
var imageWidth;
var maxImages;
var minImages = 5;
var imageMinWidth = 50;
var imageMaxWidth = 300;
var canvas;
var ctx;
var gameLoop;
var enumerator = 0;
var minYear = 0;
var maxYear = 1;
var timeSpan = 0;
var coins = Array();
var firstVisibleYear;
var lastVisibleYear;
var yearPositionMap = Array();
var viewportWidth;
var viewportHeight;
var currentCoins;
var currentCoinsStartIndex = 0;
var currentCoinsEndIndex = 0;
var lastImagePos;
var inputLayer;
var visibleCoins = Array();
var lastPan = 0;
var webConsole;
var canDrawNewImages = true;
var coinRotationInterval;
var deg = 0;
var manager;
var timelineWidth = 0;

// initialize dimensiions and event listeners like touch input
var Initialize = function(pd) {	
	//webConsole = $("#web_console");
	//$("#web_console").remove();
	document.getElementById('timeline-parent').scrollLeft = 0;
	document.getElementById('zoomIn').onclick = function () { Zoom(1); };
	document.getElementById('zoomOut').onclick = function () { Zoom(-1); };
	//document.addEventListener("scroll", HandleScroll);
	panfactor = document.getElementById('timeline-parent').scrollLeft;
	for(var i = 0; i < pd.length; i++){
		AddCoin(pd[i]);
	}
	coins.sort();	
	minYear -= 100;
	maxYear += 100;
	timeSpan = Math.abs(minYear)+Math.abs(maxYear);
	CalculateBounds();
	$("#loading").hide();
	Draw();
	$(window).resize(function(){ 
		CalculateBounds(); 
		Draw(); 
	});
	UpdateHammer();	
	window.addEventListener("scroll",function(){
		window.scrollTo(0,0)
	},false);
}

// add a coin to the list of coins which will be rendered if time-span is visible
var AddCoin = function(data){	
	if(data.to > new Date().getFullYear()) { 
		return; 
	}
	minYear = minYear < data.from ? minYear : data.from;
	maxYear = maxYear > data.to ? maxYear : data.to;
	if(coins[data.from+"-"+data.from] === undefined) {
		//Log("data: "+data.from+" -> "+data.to);
		var cl = Array();
		coins[data.from+"-"+data.from] = {coinList:cl,coinImage:"",coinTitle:""};
	}	
	coins[data.from+"-"+data.from].coinList.push(data);
}

// fetch bounds of canvas according to screen
var CalculateBounds = function() {
	//Inside function called by window.onload event handler (could go in CSS file, but   
	//better to keep it with other related code in JS file)
	document.getElementById('getDimensions').style.position = "fixed";
	document.getElementById('getDimensions').style.bottom = "0px";
	document.getElementById('getDimensions').style.right = "0px";   

	//Everything below inside function called by window.onresize event handler
	var baseWidthCalculation = document.getElementById('getDimensions').offsetLeft;
	var baseHeightCalculation = document.getElementById('getDimensions').offsetTop;
	//Account for the dimensions of the square img element (10x10)
	viewportWidth = baseWidthCalculation ;
	viewportHeight = baseHeightCalculation ;
	CalculateImageProperties();
	timelineWidth = (Math.abs(minYear) + maxYear)*zoomfactor;
	document.getElementById('timeline').style.width = timelineWidth + "px";
	document.getElementById('timeline').scrollLeft = panfactor; 
}

// fetch maximum of images which can be displayed as well as there width
var CalculateImageProperties = function() {
	maxImages = minImages;
	imageWidth = imageMinWidth;
	while(imageWidth*maxImages < viewportWidth) {
		imageWidth++;
		maxImages++;
	}
	Log("maxImages: "+maxImages+", imageWidth: "+imageWidth);
        
}

// calls drawing functions for the timeline and all images which are visible
var Draw = function() {
	Log("Panfactor: "+panfactor);
	DrawTimeFrame();
	DrawImages(true);
}

// draw the time frame with indicators of years, centuries and so on
var DrawTimeFrame = function() {
	$('.indicator').remove();
	yearPositionMap = [];
	firstVisibleYear = Math.round(minYear+panfactor/zoomfactor);
	lastVisibleYear = Math.round(minYear+(panfactor+viewportWidth)/zoomfactor);
	for(var j = minYear; j < maxYear; j++) {	
		var x = j+Math.abs(minYear);
		x *= zoomfactor;
		if(ShouldDrawTimeIndicator(j)){
			$('#timeline').append('<div class="indicator" style="border:solid 1px white; width:2px; height:50px;position:absolute;top:'+(viewportHeight-50)+'px;left:'+x+'px"><span style="margin-left:5px;color:white">'+j+'</span></div>');
		} 
		//if(zoomfactor > 10) { Log("x: "+x); }
		yearPositionMap[j] = x;
	}
	timelineWidth = (Math.abs(minYear) + maxYear)*zoomfactor;
	document.getElementById('timeline').style.width = timelineWidth + "px";
	//Log("firstVisibleYear: "+firstVisibleYear+", lastVisibleYear: "+lastVisibleYear);
}

// evaluates if the year should be drawn on the timeline according to the zoomfactor and the year (j)
var ShouldDrawTimeIndicator = function(j){
	var drawTimeIndicator = (((j%100 == 0) && zoomfactor < 2) || ((j%50 == 0) && zoomfactor >= 2 && zoomfactor < 4) || ((j%25 == 0) && zoomfactor >= 4 && zoomfactor < 8) || ((j%10 == 0) && zoomfactor >= 8 && zoomfactor < 25) || ((j%5 == 0) && zoomfactor >= 25 && zoomfactor < 50) || ((j%5 == 0) && zoomfactor >= 50));
	return drawTimeIndicator;
}

// draw the images (calls RepositionImage and draws new images)
var DrawImages  = function(drawNew) {
    Log("DrawImages");
	visibleCoins = [];
	lastImagePos = panfactor;
	for (var year = minYear; year < maxYear; year++){
		RepositionImage(yearPositionMap[year],year);
	}
	if(canDrawNewImages && drawNew) {
		setTimeout(DrawNewImages,1000);
		canDrawNewImages = false;
	}
	if(drawNew) {
		UpdateHammer();
	}
}

// draw new images (which where not visible before)
var DrawNewImages = function() {
	for (var year = firstVisibleYear; year < lastVisibleYear; year++){
		LoadImage(yearPositionMap[year],year);
	}
	canDrawNewImages = true;
	UpdateHammer();
}
// load image and then draw it
var LoadImage = function(position,year) {	
	var coin = GetSingleCoin(year+"-"+year);	
	if(coin === null) {
		return false;
	}
	var image = new Image();
        image.src = coin.url;
        image.onload = function() {
            DrawImage(position,year,coin);
        }
        image.onerror = function() {
            coin.url = "images/no_pic.jpg";
            DrawImage(position,year,coin);
        }
	
	return true;
}

// reposition the image, which was already visible
var RepositionImage = function(position, year) {
	if($("#"+year+"-title").length > 0) {
		if(!IsSpaceForImage(position) || position < document.getElementById('timeline-parent').scrollLeft || position > document.getElementById('timeline-parent').scrollLeft+viewportWidth){
			$("#"+year+"-img").remove();
			$("#"+year+"-title").remove();
		} else {
			$("#"+year+"-img").css("left",position+"px");
			$("#"+year+"-title").css("left",position+"px");
			lastImagePos = position;
			visibleCoins.push({year:year,startPos:position,endPos:position+imageWidth});
		}
	}
}

// append image to the document
var DrawImage = function(position, year, coin) {
	if(IsSpaceForImage(position)) {
		$('#timeline').append("<div id='"+year+"-img' data-year='"+year+"' style='cursor:pointer;padding:2px;z-index:98;position:absolute;top:"+viewportHeight*0.8+"px;left:"+position+"px' class='coin'><img style='user-drag: none; -moz-user-select: none;-webkit-user-drag: none' src='"+coin.url+"' width='"+imageWidth+"' ></div>");
		$('#timeline').append("<div id='"+year+"-title' data-year='"+year+"' style='cursor:pointer;z-index:98;position:absolute;top:"+viewportHeight*0.8+"px;left:"+(position+(imageWidth*.25-5))+"px;height:"+imageWidth*.5+"px;transform-origin:0 0;-webkit-transform-origin: 0 0;transform:rotate(270deg);-webkit-transform:rotate(270deg)' class='coin_title'><span>"+coin.title+"</span></div>");
		visibleCoins.push({year:year,startPos:position,endPos:position+imageWidth});
	}
}

// evaluates if there is sufficient space to draw a new coin-image
var IsSpaceForImage = function(position) {
	for(var i = 0; i < visibleCoins.length; i++) {
		if(position >= visibleCoins[i].startPos-imageWidth && position <= visibleCoins[i].endPos){
			return false;
		} else {
			continue;
		}
	}
	return true;
}

// returns a single coin with image path
var GetSingleCoin = function(key) {	
	if(coins[key] !== undefined) {
		var coin = {url:coins[key].coinList[0].image_urls[0],title:coins[key].coinList[0].title};
		coin.url = coin.url === undefined ? "images/no_pic.jpg" : coin.url;	
		coin.url = GetUrl(coin.url);
		return coin;
	} else {
		return null;
	}
}

// load json from server to show all coins at a given year
var GetCoinsForYear = function(year) {
	if($("#coin_window").length > 0) {
		Log("open");
		return;
	}
	$("#loading").show();
	Log("json/"+year+".json");
	$.getJSON("json/"+year+".json",function(json){
		currentCoins = json;
		currentCoinsStartIndex = 0;
		currentCoinsEndIndex = currentCoins.length > 10 ? 10 : currentCoins.length;
		DrawCoinWindow();
		$("#loading").hide();
		LoadCoinsForWindow();
	});
}

// append a window to show all coins for a year to the document
var DrawCoinWindow = function() {
	$('body').append("<div id='coin_window' style='overflow:hidden;position:fixed;width:"+window.innerWidth*.5+"px;height:"+window.innerHeight*.65+"px;left:"+window.innerWidth*.25+"px;top:"+window.innerHeight*.05+"px'></div>");
	$("#coin_window").append("<div style='height:30px'><h2>Coins beginning with year "+GetCoinLabel(currentCoins[0].from)+"</h2><span style='position:absolute;top:0;right:0;z-index:10000;cursor:pointer' onclick='CloseCoinWindow()'><img src='images/close_button.png' width='40'></span><div>");
	$("#coin_window").append("<div id='coin_container' style='overflow-y:scroll;height:85%;background-color:darkgrey;padding:5px'></div>");        
	$("#coin_window").append("<span id='coin_counter' style='position:absolute;bottom:0;left:10px;height:20px;'></span><span id='load_more' style='position:absolute;bottom:0;right:10px;height:20px;cursor:pointer;z-index:10000' onclick='LoadCoinsForWindow()'>Load more...</span>");
}

// load coins for the coin-window for the current year
var LoadCoinsForWindow = function() {
	for(var i = currentCoinsStartIndex; i < currentCoinsEndIndex; i++) {
		var url = GetUrl(currentCoins[i].image_urls[0]);
                var title = currentCoins[i].title;
                var image = new Image();
                Log("Image: "+url);
                image.onload = DrawCoinForWindow(url,title,i); 
                image.onerror = DrawCoinForWindow("images/no_pic.jpg",title,i);
	}
	currentCoinsStartIndex = currentCoinsEndIndex;
	currentCoinsEndIndex = currentCoins.length > currentCoinsEndIndex+10 ? currentCoinsEndIndex+10 : currentCoins.length;
	if(currentCoinsEndIndex == currentCoins.length) {
		$('#load_more').remove();
	}
	$('#coin_counter').html(currentCoinsEndIndex+' from '+ currentCoins.length +' coins loaded.');
}

// append a coin with title to the coin window container
var DrawCoinForWindow = function(url,title,i) {
    $("#coin_container").append("<div class='coin_list' onclick='ShowCoinRotation("+i+")'><div class='coin_list_img'><img width='50' src='"+url+"'></div><div class='coin_list_title'>"+title+"</div></div><div style='clear:both'></div><hr>");
}

// maximizes a coin and rotates it
var ShowCoinRotation = function(id) {
    Log("OpenCoinRotation for "+id);    
	$('body').append("<div id='coin_rotation_window' style='overflow:hidden;position:fixed;width:"+window.innerWidth+"px;height:"+window.innerHeight+"px; top:0px;left:0px;z-index:100000;'></div>");
	$("#coin_rotation_window").append("<div style='height:30px;margin-top:10px;'><h2>"+currentCoins[id].title+"</h2><span style='position:absolute;top:0;right:10px;z-index:100000;cursor:pointer' onclick='CloseCoinRotationWindow()'><img src='images/close_button.png' width='40'></span><div>");
	var url1 = GetUrl(currentCoins[id].image_urls[0]);
	var url2 = "";
	if(currentCoins[id].image_urls.length > 1) {
		url2 = GetUrl(currentCoins[id].image_urls[1]);
	}
	$("#coin_rotation_window").append("<div style='margin:"+viewportHeight*.05+"px "+viewportWidth*.35+"px;perspective:1000px'><div id='rotation_container'><div style='position:absolute;top:0;left:0;-webkit-backface-visibility: hidden;backface-visibility: hidden;'><img src='"+url1+"' width='"+viewportWidth*.3+"'></div><div style='position:absolute;top:0;left:0;transform:rotateY(180deg);-webkit-backface-visibility: hidden;backface-visibility: hidden;'><img src='"+url2+"' width='"+viewportWidth*.3+"'></div></div></div>");
	deg = 0;
	coinRotationInterval = setInterval(RotateCoin,100);
}

// rotate the coin with a interval
var RotateCoin = function() {
    var div = document.getElementById('rotation_container');
    div.style.webkitTransform = 'rotateY('+deg+'deg)'; 
    div.style.mozTransform    = 'rotateY('+deg+'deg)'; 
    div.style.msTransform     = 'rotateY('+deg+'deg)'; 
    div.style.oTransform      = 'rotateY('+deg+'deg)'; 
    div.style.transform       = 'rotateY('+deg+'deg)'; 
    deg+=5;
}

/////////////
// HELPERS //
/////////////

// concat a label according to year
var GetCoinLabel = function(year) {
    return year < 0 ? Math.abs(year) + " B.C." : year;
}

// manipulate a url to load smaller images
var GetUrl = function(url){
	var newString = url;
	if(url.substring(8,20) == "finds.org.uk" ) {
		newString = url.substring(0,url.lastIndexOf("/"))+"/medium"+url.substring(url.lastIndexOf("/"),url.length);
	}
	return newString;
}

////////////////////
// INPUT HANDLING //
////////////////////

// close the coin window
var CloseCoinWindow = function() {
    $("#coin_window").remove();
}

// close the window of the maximized rotating coin 
var CloseCoinRotationWindow = function() {
    $("#coin_rotation_window").remove();
    clearInterval(coinRotationInterval);
}

// handle the zoom and call the drawing functions, do not draw new images 
var HandleZoom  = function(percentage,center) {
    percentage = percentage > 1 ? percentage-1 : -(1-percentage);
    var check = zoomfactor + percentage;	
	Log("Percentage: "+percentage);
    if(check < 1 || check > 100){
        return;
    }
    zoomfactor += percentage;
    $("#zoomfactor").html(Math.round(zoomfactor)+" x");
    DrawTimeFrame();
    DrawImages(false);
	
}

// called from the + and - button in the document
var Zoom = function(percentage) {
    var check = zoomfactor + percentage;	
    if(check < 1 || check > 100){
        return;
    }
    zoomfactor += percentage;
    $("#zoomfactor").html(Math.round(zoomfactor)+" x");
    Draw();
}

// handle single tap
var HandleTap = function(tapPosition) {
    for(var i = 0; i < visibleCoins.length; i++) {
        if(tapPosition.x+panfactor > visibleCoins[i].startPos && tapPosition.x+panfactor <  visibleCoins[i].endPos) {
            GetCoinsForYear(visibleCoins[i].year);
                break;
        }
    }
}

// register hammer.js event listeners
var UpdateHammer = function() {
	$("#input_layer").remove();
	$("#timeline").append("<div id='input_layer'><div>");
	inputLayer = $("#input_layer");
	inputLayer.css('width',document.body.clientWidth+panfactor+"px");
	inputLayer.css('height',document.body.clientHeight+"px");
	inputLayer = document.getElementById('input_layer');
	if(manager) {
            Log("Destroy Input Manager");
            manager.destroy();
        }
    Log("Register Input Events");
	manager = new Hammer.Manager(inputLayer);
	var Pan = new Hammer.Pan();
	var Pinch = new Hammer.Pinch();
	var Tap = new Hammer.Tap({
		taps: 1
	});
	manager.add(Pan);
	manager.add(Pinch);
	manager.add(Tap);
	manager.on("panleft panright", function(ev) {
		
		var pan = ev.deltaX-lastPan;
		UpdatePanHammer(-pan);
		lastPan = ev.deltaX;
	});
	manager.on("panend",function(ev) {
		lastPan = 0;
		Log("DRAW");
		Draw();
		
	});
	manager.on("pinchmove",function(ev){
		//Log("Scale: "+ev.scale+ ", Center: "+ev.center);
		HandleZoom(ev.scale,ev.center);
	});
	manager.on("pinchend",function(ev){
		//$(".coin").remove();
		//$(".coin_title").remove();
		Draw();
	});
	manager.on("tap",function(ev){
		HandleTap(ev.center);
	});
}

// set the scrollLeft according to the pan from hammer.js
var UpdatePanHammer = function(factor){
    panfactor += factor;
    //Log("panfactor: "+panfactor+" - factor: "+factor);  
    if(panfactor < 0) {
		panfactor = 0;
	} else if(panfactor > timelineWidth - viewportWidth) {
		panfactor = timelineWidth - viewportWidth;
    } 
    document.getElementById('timeline-parent').scrollLeft = panfactor;   
}

//////////////////////
///// LOGGING ////////
//////////////////////

var Log = function(msg) {
	//return;
	//console.log(msg);
	//webConsole.append("<span>"+msg+"</span></br>");
}