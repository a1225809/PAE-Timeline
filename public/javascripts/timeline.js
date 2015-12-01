$(document).ready(function() {
	$("#loading").show();
	$("#loading").css("top",(window.innerHeight-100)/2);
	$("#loading").css("left",(window.innerWidth-100)/2);
	$.ajax({
	url:'objects',
	method:'get'}		
	).success(function(data){
		console.log("Retrieving data success.");
		var pd = JSON.parse(data);			
		Initialize(pd);
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
var visibleMinYear;
var visibleMaxYear;
var yearPositionMap = Array();

var Initialize = function(pd) {
	canvas = document.getElementById("coin-canvas");
	ctx = canvas.getContext("2d");
	
	document.getElementById("zoomfactor").value = zoomfactor;
	document.getElementById("panfactor").value = panfactor;
	for(var i = 0; i < pd.length; i++){
		AddCoin(pd[i]);
	}
	coins.sort();	
	minYear -= 100;
	maxYear += 100;
	timeSpan = Math.abs(minYear)+Math.abs(maxYear);
	CalculateBounds();
	//gameLoop = setInterval("GameLoop",1000/150);
	$("#loading").hide();
	Draw();
}

// fetch bounds of canvas according to screen
var CalculateBounds = function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	CalculateImageProperties();
}

// fetch maximum of images which can be displayed as well as there width
var CalculateImageProperties = function() {
	var iw = imageMaxWidth;
	maxImages = minImages;
	imageWidth = imageMinWidth;
	while(imageWidth*maxImages > window.innerWidth) {
		imageWidth++;
		maxImages++;
	}
}

var GameLoop = function() {
	Update();
	Draw();
}

var Update = function() {
	
}

var Draw = function() {
	DrawTimeFrame();
	//DrawImages();
}

// draw the time frame with indicators of years, centuries and so on
var DrawTimeFrame = function() {	
	ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
	ctx.font = "12px Arial";
	var cnt = 0;
	yearPositionMap = [];
	for(var j = minYear; j < maxYear; j+=GetLineStep()) {	
		var mappedPan = (timeSpan*zoomfactor-window.innerWidth)*panfactor;
		var x = j+Math.abs(minYear);
		x *= zoomfactor;
		x -= mappedPan;
		if(x < 0) {
			continue;
		} 		
		if(x > window.innerWidth) {
			break;
		}
		ctx.fillText(Math.round(j),x+5,window.innerHeight-50);
		ctx.fillRect(x,window.innerHeight,1,-window.innerHeight*0.55);
		yearPositionMap.push({year:j,position:x});
	}
}

var GetLineStep = function() {
	var x  = (100*zoomfactor)%100;
	if(x > 50) {
		return x;
	} else { 
		return 100+x;
	}
}

var DrawImages  = function() {
	$('.coin').remove();
	var lastImagePos = 0;	
	for(var i = 0; i < yearPositionMap.length; i++) {
		if(i < yearPositionMap.length-1) {
			console.log("pos: "+yearPositionMap[i].position+", year: "+yearPositionMap[i+1].year);
			for(var position = yearPositionMap[i].position; position < yearPositionMap[i+1].position; position++) {							
				for(var year = yearPositionMap[i].year; year < yearPositionMap[i+1].year; year++) {
					if(position > lastImagePos+imageWidth && LoadImage(position,year)) {
						console.log("DRAW IMAGE at position: "+position);						
						lastImagePos = position;
					}
				}
			}				
		}
	}
}

var LoadImage = function(position,year) {	
	var url = GetImageUrl(year);
	if(url == "") {
		return false;
	}
	$('body').append("<div id='"+year+"' style='z-index:1000;position:fixed;top:"+window.innerHeight*0.5+"px;left:"+position+"px' class='coin'><img src='"+url+"' width='"+imageWidth+"' height='"+imageWidth+"'></div>");
	return true;
}


var GetImageUrl = function(year) {
	//console.log("Get Coin for Year: "+year);
	if(year in coins) {
		return coins[year].coinList[0].image_urls[0];
	} else {
		return "";
	}
}

var UpdateZoom = function(el){
	zoomfactor = parseFloat(el.value,10);	
	$("#zoomval").html(el.value+"x");
	Draw();
}

var UpdatePan = function(el) {
	panfactor = parseFloat(el.value,10);
	$("#panval").html(el.value);
	Draw();
}

var Translate = function(x,y){
	ctx.translate(x,y);
	ctx.currentTranslation = {x:x,y:y};
}

var AddCoin = function(data){	
	if(data.to > new Date().getFullYear()) { 
		return; 
	}
	
	minYear = minYear < data.from ? minYear : data.from;
	maxYear = maxYear > data.to ? maxYear : data.to;
	if(!(minYear in coins)) {
		//console.log("data: "+data.from+" -> "+data.to);
		var cl = Array();
		coins[minYear] = {coinList:cl};
	}	
	coins[minYear].coinList.push(data);
}

