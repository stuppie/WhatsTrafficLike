// Saves options to chrome.storage
function save_options() {
    var origin = document.getElementById('origin').value;
    var destination = document.getElementById('destination').value;
    var api_key = document.getElementById('api_key').value;
    var time_wo_traffic = get_time_without_traffic(origin, destination);
    chrome.storage.sync.set({
        origin: origin,
        destination: destination,
        api_key: api_key,
        time_wo_traffic: time_wo_traffic
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved. Time w/o traffic: ' + Math.round(time_wo_traffic / 60);
        setTimeout(function () {
            status.textContent = '';
        }, 2000);
    });
}

// Restores form state using the preferences stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        origin: 'North Park, CA',
        destination: 'La Jolla, CA',
        api_key: ""
    }, function (items) {
        document.getElementById('origin').value = items.origin;
        document.getElementById('destination').value = items.destination;
        document.getElementById('api_key').value = items.api_key;
    });
}


function get_time_without_traffic(origin, destination) {
    // BLOCKING / SYNCHRONOUS
    var url = "https://maps.googleapis.com/maps/api/directions/json?origin=" + origin + "&destination=" + destination + "&departure_time=now&mode=driving&alternatives=true";
    console.log(url);
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.send();
    if (request.status === 200) {
        var resp = JSON.parse(request.responseText);
        chrome.extension.getBackgroundPage().console.log(resp);

        dur = [];
        for (route in resp.routes) {
            dur.push(resp.routes[route].legs[0].duration.value)
        }
        return Math.min.apply(Math, dur);
    }
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

// Set up autocomplete
var origin_input = /** @type {!HTMLInputElement} */(document.getElementById('origin'));
var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
var destination_input = /** @type {!HTMLInputElement} */(document.getElementById('destination'));
var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
