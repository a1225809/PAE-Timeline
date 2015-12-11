$(document).ready(function(){
	console.log("Hammer");
	var mc = new Hammer(document.body);
	mc.on("panleft panright", function(ev) {
		myElement.textContent = ev.type +" gesture detected.";
	});
});
/*
document.body.addEventListener('touchmove', function(event) {
  event.preventDefault();
}, false);
*/
