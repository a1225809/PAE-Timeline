
var UpdateHammer = function() {
	var input = document.getElementById("coin_canvas");
	var mc = new Hammer(input);
	mc.on("panleft panright", function(ev) {
		//console.log(ev.deltaX/screen.width);
		UpdatePanHammer(ev.deltaX/screen.width);
	});
	$(".coin .coin_title").each(function() {
		var mc = new Hammer(this);
		mc.on("panleft panright", function(ev) {
			//console.log(ev.deltaX/screen.width);
			UpdatePanHammer(ev.deltaX/screen.width);
		});
	});
}
/*
document.body.addEventListener('touchmove', function(event) {
  event.preventDefault();
}, false);
*/
