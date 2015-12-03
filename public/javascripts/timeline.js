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
var firstVisibleYear;
var lastVisibleYear;
var yearPositionMap = Array();
var viewportWidth;
var viewportHeight;
var currentCoins;
var currentCoinsStartIndex = 0;
var currentCoinsEndIndex = 0;

var Initialize = function(pd) {	
	canvas = document.getElementById("coin-canvas");
	ctx = canvas.getContext("2d");	
	document.getElementById("zoomfactor").value = zoomfactor;
	document.getElementById("panfactor").value = panfactor;
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
	canvas.width = viewportWidth;
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
	/*for(var i = minYear; i < maxYear; i++){
		//console.log(i);
		//console.log(coins[i]);
		if(coins[i] != undefined) {
			var s = "<span>Year: "+i+", "+coins[i].coinList[0].title+", ";
			if(coins[i].coinList[0].image_urls !== undefined) {
				s+=coins[i].coinList[0].image_urls[0];
			} else {
				s+= "undefined";
			}
			s+="</span><br>";
			$('body').append(s);
		}
	}*/
	DrawTimeFrame();
	DrawImages();
}

// draw the time frame with indicators of years, centuries and so on
var DrawTimeFrame = function() {
	ctx.clearRect(0,0,viewportWidth,viewportHeight);
	ctx.font = "12px Arial";
	var cnt = 0;
	yearPositionMap = [];
	console.log("minYear: "+minYear+", maxYear: "+maxYear);
	for(var j = minYear; j < maxYear; j++) {	
		var mappedPan = (timeSpan*zoomfactor-viewportWidth)*panfactor;
		var x = j+Math.abs(minYear);
		x *= zoomfactor;
		x -= mappedPan;
		if(x < 0) {
			continue;
		} else if(x == 0){
			firstVisibleYear = j;
		}	
		if(x > viewportWidth) {
			console.log(x);
			lastVisibleYear = j;
			break;
		}
		
		if(ShouldDrawTimeIndicator(j)){
			ctx.fillText(Math.round(j),x+5,viewportHeight-50);
			ctx.fillRect(x,viewportHeight,1,-viewportHeight*0.35);
		} else {
			
		}
		yearPositionMap[j] = x;
	}
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
	//console.log(year+": "+coin.url);
	$('body').append("<div onclick='GetCoinsForYear(this)' data-year='"+year+"' style='z-index:99;position:absolute;top:"+viewportHeight*0.8+"px;left:"+position+"px' class='coin'><img src='"+coin.url+"' width='"+imageWidth+"' height='"+imageWidth+"'></div>");
	$('body').append("<div onclick='GetCoinsForYear(this)' data-year='"+year+"' style='z-index:99;position:absolute;top:"+viewportHeight*0.8+"px;left:"+(position+(imageWidth*.25-5))+"px;height:"+imageWidth*.5+"px;transform-origin:0 0;transform:rotate(270deg)' class='coin_title'><span>"+coin.title+"</span></div>");
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
	var year = el.getAttribute('data-year');
	$("#loading").show();
	$.ajax({
		url:'coins',
		method:'get',
		data:{year:year}
	}).success(function(data){
		console.log("Retrieving coins success.");
		var pd = JSON.parse(data);	
		currentCoins = pd;
		currentCoinsStartIndex = 0;
		currentCoinsEndIndex = pd.length > 10 ? 10 : pd.length;
		DrawCoinWindow();
		$("#loading").hide();
	});
}

var DrawCoinWindow = function() {
	$('body').append("<div id='coin_window' style='overflow-y:scroll;position:fixed;width:"+window.innerWidth*.5+"px;height:"+window.innerHeight*.5+"px;left:"+window.innerWidth*.25+"px;top:"+window.innerHeight*.25+"px'></div>");
	$("#coin_window").append("<h3>Coins beginning with year "+currentCoins[0].from+"</h3><span style='position:absolute;top:0;right:0;z-index:100000' onclick='CloseCoinWindow()'>Close</span>");
	for(var i = currentCoinsStartIndex; i < currentCoinsEndIndex; i++) {
		$("#coin_window").append("<div class='coin_list'><div class='coin_list_img'><img width='50' height='50' src='"+currentCoins[i].image_urls[0]+"'></div><div class='coin_list_title'>"+currentCoins[i].title+"</div></div><br>");
	}
	$("#coin_window").append("<span style='position:absolute;bottom:0;right:0;z-index:100000' onclick='DrawCoinWindow()'>Load more...</span>");
}

var CloseCoinWindow = function() {
	$("#coin_window").remove();
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

