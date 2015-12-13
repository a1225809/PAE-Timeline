$(document).ready(function() {
	$("#loading").show();
	$("#loading").css("top",(window.innerHeight)/2);
	$("#loading").css("left",(window.innerWidth)/2);
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

var Initialize = function(pd) {	
	canvas = document.getElementById("coin_canvas");
	ctx = canvas.getContext("2d");	
	//document.getElementById("zoomfactor").value = zoomfactor;
	//document.getElementById("panfactor").value = panfactor;
	for(var i = 0; i < pd.length; i++){
		AddCoin(pd[i]);
		//console.log(pd[i].from+" - "+pd[i].image_urls[0]);
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
		CalculateImageProperties(); 
		Draw(); 
	});
        document.getElementById('zoomIn').onclick = function () { Zoom(0.2); };
        document.getElementById('zoomOut').onclick = function () { Zoom(-0.2); };
	
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
	canvas.width = maxYear+Math.abs(minYear);
	canvas.height = viewportHeight;
	
	CalculateImageProperties();
}

// fetch maximum of images which can be displayed as well as there width
var CalculateImageProperties = function() {
	maxImages = minImages;
	imageWidth = imageMinWidth;
	while(imageWidth*maxImages < viewportWidth) {
		imageWidth++;
		maxImages++;
	}
	console.log("maxImages: "+maxImages+", imageWidth: "+imageWidth)
}

var Draw = function() {
	DrawTimeFrame();
	DrawImages();
	UpdateHammer();	
}

// draw the time frame with indicators of years, centuries and so on
var DrawTimeFrame = function() {
	ctx.clearRect(0,0,maxYear+Math.abs(minYear),viewportHeight);
	ctx.font = "12px Arial";
	var cnt = 0;
	yearPositionMap = [];
        canvas.width = (maxYear+Math.abs(minYear))*zoomfactor;
	console.log("minYear: "+minYear+", maxYear: "+maxYear);
	for(var j = minYear; j < maxYear; j++) {	
		var mappedPan = (timeSpan*zoomfactor-viewportWidth)*panfactor;
		var x = j+Math.abs(minYear);
		x *= zoomfactor;
		x -= mappedPan;
		/*if(x < 0) {
			continue;
		} else if(x == 0){
			firstVisibleYear = j;
		}	
		if(x > viewportWidth) {			
			lastVisibleYear = j;
			break;
		}
		*/
		if(ShouldDrawTimeIndicator(j)){
			ctx.fillText(Math.round(j),x+5,viewportHeight-10);
			ctx.fillRect(x,viewportHeight,1,-viewportHeight*0.35);
		} else {
			
		}
		yearPositionMap[j] = x;
	}
	firstVisibleYear = minYear;
        lastVisibleYear = maxYear;
	console.log("firstVisibleYear: "+firstVisibleYear+", lastVisibleYear: "+lastVisibleYear);
}

var ShouldDrawTimeIndicator = function(j){
	return (((j%100 == 0) && zoomfactor < 2) || ((j%50 == 0) && zoomfactor >= 2 && zoomfactor < 4) || ((j%25 == 0) && zoomfactor >= 4 && zoomfactor < 8) || ((j%10 == 0) && zoomfactor >= 8));
}

var DrawImages  = function() {
	$('.coin').remove();
	$('.coin_title').remove();
	var lastImagePos = 0;
	var position = 0;
	for (var year = firstVisibleYear; year < lastVisibleYear; year++){
		//console.log("LOOK UP IMAGE for year "+ year + " at position: "+yearPositionMap[year]);
		if(yearPositionMap[year] > lastImagePos+imageWidth && coins[year+"-"+year] !== undefined) {	
			LoadImage(yearPositionMap[year],year);
			lastImagePos = yearPositionMap[year];
		}
	}
}

var LoadImage = function(position,year) {	
	var coin = GetSingleCoin(year+"-"+year);	
	if(coin === null) {
		return false;
	}
	coin.url = coin.url === undefined ? "images/no_pic.jpg" : coin.url;	
	coin.url = GetUrl(coin.url);
	$('body').append("<div onclick='GetCoinsForYear(this)' id='"+year+"-img' data-year='"+year+"' style='padding:2px;z-index:99;position:absolute;top:"+viewportHeight*0.8+"px;left:"+position+"px' class='coin'><img style='user-drag: none; -moz-user-select: none;-webkit-user-drag: none' src='"+coin.url+"' width='"+imageWidth+"' ></div>");
	$('body').append("<div onclick='GetCoinsForYear(this)' id='"+year+"-title' data-year='"+year+"' style='z-index:99;position:absolute;top:"+viewportHeight*0.8+"px;left:"+(position+(imageWidth*.25-5))+"px;height:"+imageWidth*.5+"px;transform-origin:0 0;-webkit-transform-origin: 0 0;transform:rotate(270deg);-webkit-transform:rotate(270deg)' class='coin_title'><span>"+coin.title+"</span></div>");
	return true;
}

var GetSingleCoin = function(key) {	
	//console.log("GetSingleCoin: "+key);
	if(coins[key] !== undefined) {
		//console.log(year+": "+coins[year].coinList[0].image_urls.length+" images, Title: "+coins[year].coinList[0].title);
		return {url:coins[key].coinList[0].image_urls[0],title:coins[key].coinList[0].title};
	} else {
		return null;
	}
}

var GetCoinsForYear = function(el) {
	if($("#coin_window").length > 0) {
		console.log("open");
		return;
	}
	var year = el.getAttribute('data-year');
	$("#loading").show();
	$.getJSON("json/"+year+".json",function(json){
		currentCoins = json;
		currentCoinsStartIndex = 0;
		currentCoinsEndIndex = currentCoins.length > 10 ? 10 : currentCoins.length;
		DrawCoinWindow();
		$("#loading").hide();
		LoadCoinsForWindow();
	});
}

var DrawCoinWindow = function() {
	$('body').append("<div id='coin_window' style='overflow:hidden;position:fixed;width:"+window.innerWidth*.5+"px;height:"+window.innerHeight*.5+"px;left:"+window.innerWidth*.25+"px;top:"+window.innerHeight*.25+"px'></div>");
	$("#coin_window").append("<h2>Coins beginning with year "+currentCoins[0].from+"</h2><span style='position:absolute;top:0;right:0;z-index:100000' onclick='CloseCoinWindow()'>X </span>");
	$("#coin_window").append("<div id='coin_container' style='overflow-y:scroll;height:90%;background-color:darkgrey;padding:5px'></div>");
	$("#coin_window").append("<span style='position:absolute;bottom:0;right:0;z-index:100000' onclick='LoadCoinsForWindow()'>Load more...</span>");
}

var LoadCoinsForWindow = function() {
	for(var i = currentCoinsStartIndex; i < currentCoinsEndIndex; i++) {
		var url = GetUrl(currentCoins[i].image_urls[0]);
		$("#coin_container").append("<div class='coin_list'><div class='coin_list_img'><img width='50' src='"+url+"'></div><div class='coin_list_title'>"+currentCoins[i].title+"</div></div><div style='clear:both'></div><hr>");
	}
	currentCoinsStartIndex = currentCoinsEndIndex;
	currentCoinsEndIndex = currentCoins.length > currentCoinsEndIndex+10 ? currentCoinsEndIndex+10 : currentCoins.length;
}

var GetUrl = function(url){
	//console.log(url);
	//console.log(url.substring(8,20));
	var newString = url;
	if(url.substring(8,20) == "finds.org.uk" ) {
		newString = url.substring(0,url.lastIndexOf("/"))+"/medium"+url.substring(url.lastIndexOf("/"),url.length);
		//console.log(url.lastIndexOf("/"));
		//console.log(newString);
	}
	return newString;
}
var CloseCoinWindow = function() {
	$("#coin_window").remove();
}

var UpdateZoom = function(el){
	zoomfactor = parseFloat(el.value,10);	
	$("#zoomval").html(el.value+"x");
	Draw();
}

var Zoom = function(percentage) {
    var check = zoomfactor + percentage;
    if(check < 1 || check > 10){
        return;
    }
    zoomfactor += percentage;
    Draw();
}

var UpdatePan = function(el) {
	panfactor = parseFloat(el.value,10);
	$("#panval").html(el.value);
	Draw();
}
var UpdatePanHammer = function(factor){
	if(panfactor+factor < 0 || panfactor+factor > 1) {
		return;
	}
	console.log(factor);
	panfactor += factor;
	$("#panval").html(panfactor);
	Draw();
}

var AddCoin = function(data){	
	if(data.to > new Date().getFullYear()) { 
		return; 
	}
	
	minYear = minYear < data.from ? minYear : data.from;
	maxYear = maxYear > data.to ? maxYear : data.to;
	if(coins[data.from+"-"+data.from] === undefined) {
		//console.log("data: "+data.from+" -> "+data.to);
		var cl = Array();
		coins[data.from+"-"+data.from] = {coinList:cl};
	}	
	coins[data.from+"-"+data.from].coinList.push(data);
}