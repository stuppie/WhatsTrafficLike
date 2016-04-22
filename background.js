
function generate_set_icon(mode, time){
	// mode is one of "green", "yellow", "red", "gray", "white"
	var settings = {gray: {background: "lightgray", text: "black"},
					white: {background: "white", text: "black"},
					green: {background: "green", text: "white"},
					yellow: {background: "yellow", text: "black"},
					red: {background: "red", text: "white"}}

	var canvasIcon = document.createElement("canvas");
    //canvasIcon.id = "canvasIcon";
	canvasIcon.width = 19;
	canvasIcon.height = 19;

	var ctx = canvasIcon.getContext("2d");
    ctx.clearRect(0, 0, canvasIcon.width, canvasIcon.height);
	ctx.fillStyle = settings[mode].background;
	ctx.fillRect(0,0,19,19);
	ctx.font = "bold 17px Arial";
	ctx.textAlign = "center";
	ctx.textBaseline = 'middle';
	ctx.fillStyle = settings[mode].text;
	/*
	// to fit 3 and 4 char numbers, scale them down
	// probably the most shitty & frustrating way of doing this ever
	var metrics = ctx.measureText(time);
	var border = 1.1
	var scalex = canvasIcon.width / (border * metrics.width);
	var scaley = canvasIcon.height / (border * 18);
	ctx.translate((canvasIcon.width/2)*(1-scalex), (canvasIcon.height/2)*(1-scaley));
	ctx.scale(scalex, scaley);
	ctx.fillText(time, canvasIcon.width/2, canvasIcon.height/2);
    */
    
    ctx.fillText(time, canvasIcon.width/2, canvasIcon.height/2);
	chrome.browserAction.setIcon({'imageData': ctx.getImageData(0,0,19,19)});
}

// not in use right now
function is_primetime() {
    var now = moment();
    var morningPrimetime = now.isBetween(moment({hour: 6, minute: 30}), moment({hour: 10, minute: 0}));
    var eveningPrimetime = now.isBetween(moment({hour: 12+4, minute: 0}), moment({hour: 12+7, minute: 0}));
    if (morningPrimetime | eveningPrimetime)
        return true;
    else
        return false;
}

var interval = 0;
function get_options_and_directions() {
	clearInterval(interval)
    chrome.storage.sync.get(["origin","destination","api_key"], function(s) { 
		if (s.api_key.length > 0) {
			get_directions(s.origin, s.destination, s.api_key);
			interval = setInterval(function() { get_directions(origin, destination, api_key); }, 60000 * 5); //5 min
		}
		else {
			get_directions_without_traffic(s.origin, s.destination);
			interval = setInterval(function() { get_directions_without_traffic(origin, destination); }, 60000 * 5); //5 min
			}
	});
}

function get_directions(origin, destination, api_key) {
	var url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + origin + "&destination=" + destination + "&departure_time=now&mode=driving&alternatives=true&key=" + api_key;
	console.log(url);
	var request = new XMLHttpRequest();
	request.onreadystatechange = function() {
		if (request.readyState == 4) {
			var resp = JSON.parse(request.responseText);
			console.log(resp);
			if (resp.status == "OK"){
				var color = 'green';
				var dur_traffic = resp.routes[0].legs[0].duration_in_traffic.value
				var dur = resp.routes[0].legs[0].duration.value
				console.log((dur_traffic/dur));
				if ((dur_traffic/dur) > 1.7) {
				  color = "red";
				} else if ((dur_traffic/dur) > 1.2) {
				  color = "yellow";
				} else {
				  color = "green";
				}
				generate_set_icon(color, Math.round(dur_traffic/60));
				
			} else {
				console.log(resp.status + ": " + resp.error_message)
				chrome.browserAction.setIcon({path:"icons/invalid.png"});
			}
	  }
  }
  request.open('GET', url, true);
  request.send();
}

function get_directions_without_traffic(origin, destination) {
  var url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + origin + "&destination=" + destination + "&departure_time=now&mode=driving&alternatives=true";
  console.log(url);
  var request = new XMLHttpRequest();
  request.onreadystatechange = function() {
	  if (request.readyState == 4) {
		var resp = JSON.parse(request.responseText);
		console.log(resp);
		generate_set_icon("white", Math.round(resp.routes[0].legs[0].duration.value/60));
	  }
  }
  request.open('GET', url, true);
  request.send();
}

function goto_map_url() {
    chrome.storage.sync.get(["origin","destination"], function(s) {
		var map_url = "https://www.google.com/maps/dir/" + s.origin + "/" + s.destination;
		chrome.tabs.create({url: map_url});
	});
}

// Make first query when extension first loads
//get_options_and_directions();

// When you click the icon, open a map
chrome.browserAction.onClicked.addListener(goto_map_url);

//When the stored preferences change, reload.
chrome.storage.onChanged.addListener(get_options_and_directions);

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
      title: "Refresh times",
      contexts: ["browser_action"],
      onclick: get_options_and_directions
});
chrome.contextMenus.create({
      title: "Open Map",
      contexts: ["browser_action"],
      onclick: goto_map_url
});

