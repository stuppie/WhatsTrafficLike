// Saves options to chrome.storage
function save_options() {
  var origin = document.getElementById('origin').value;
  var destination = document.getElementById('destination').value;
  var api_key = document.getElementById('api_key').value;
  chrome.storage.sync.set({
    origin: origin,
    destination: destination,
    api_key: api_key
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {status.textContent = '';}, 2000);
  });
}

// Restores form state using the preferences stored in chrome.storage.
function restore_options() {
  chrome.storage.sync.get({
    origin: 'North Park, CA',
    destination: 'La Jolla, CA',
    api_key: ""
  }, function(items) {
    document.getElementById('origin').value = items.origin;
    document.getElementById('destination').value = items.destination;
    document.getElementById('api_key').value = items.api_key;
  });
}

// Not doing this for now
// check if key is valid. Synchronous! So it runs before the values get saved
function check_api_key(api_key) {
  var url = "https://maps.googleapis.com/maps/api/directions/json?origin=miami,fl&destination=kendall,fl&departure_time=now&mode=driving&alternatives=false&key=" + api_key;
  chrome.extension.getBackgroundPage().console.log(url); 
  var request = new XMLHttpRequest();
  request.open('GET', url, false);
  request.send();
  if (request.status === 200) {
    var resp = JSON.parse(request.responseText);
    chrome.extension.getBackgroundPage().console.log(resp);
    if (resp.status != "OK"){
       document.getElementById('api_key_valid').textContent = resp.status + ": " + resp.error_message;
       return false;
    }
    document.getElementById('api_key_valid').textContent = resp.status;
    return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);

// Set up autocomplete
var origin_input = /** @type {!HTMLInputElement} */(document.getElementById('origin'));
var origin_autocomplete = new google.maps.places.Autocomplete(origin_input);
var destination_input = /** @type {!HTMLInputElement} */(document.getElementById('destination'));
var destination_autocomplete = new google.maps.places.Autocomplete(destination_input);
