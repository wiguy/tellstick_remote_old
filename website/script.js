var targetport = 8876;
var targetaddress = "baekkevold.dynamic-dns.net";
var target = targetaddress+":"+targetport;
var wsprotocol = "rust-websocket";

if (isHashConfirmed() == "true") {
	runstatus();
} else {
	runlogin();
}

function isHashConfirmed() {
	hash = window.localStorage.getItem("hash");
	if (hash != null) return "true";
	return "false";
}

function runlogin() {
	var pContent = document.getElementById('pContent');
	pContent.innerHTML =	
				'<form onsubmit="return dologin()" action="" method="get"><div data-role="fieldcontain">' +
				'<label for="user">Brukernavn</label>' +
				'<input type="text" id="user" name="user" placeholder="brukernavn" required />' +
				'</div>' +
				'<div data-role="fieldcontain">' +
				'<label for="password">Passord</label>' +
				'<input type="password" id="password" name="password" placeholder="passord" required />' +
				'</div>' +
				'<input type="submit" name="login" value="Logg inn"></div></form>';

	pContent.innerHTML +=	'<br><label name="status" id="status"></label>';
}

function dologin() {
	var user = document.getElementById('user').value;
	var pwd = document.getElementById('password').value;
	var hash = CryptoJS.SHA1(user+":"+pwd).toString(CryptoJS.enc.Hex);
	var socket = new WebSocket('ws://'+target, wsprotocol);
	var returnval = "";
	var returnedhash = "";
	var count = 0;
	var idletime = 50;
	var maxtime = 5000;
	socket.onerror = function(event) {
		returnval = "done";
	};
	socket.onopen = function(event) {
		//object must be formatted so that the json output format is correct for rust json
		var msg = {"hash":hash, "action":"Login"};
		var msgjson = JSON.stringify(msg);
		socket.send(msgjson);
	};
	socket.onmessage = function(event) {
		var msg = JSON.parse(event.data);
		returnedhash = msg.hash;
		returnval = "done";
	};
	var waitforhash = function(callback) {
		setTimeout(function() {
			if (returnval == "done") {
				callback();
				return;
			} else {
				count++;
				if (count*idletime>=maxtime) {
					callback();
					return;
				}
				waitforhash(callback);
			}
		}, idletime);
	};
	waitforhash(function() {
		if (returnedhash == hash) {
			//hash is ok
			//store hash and reload
			window.localStorage.setItem("hash",hash);
			socket.close();
			window.location.reload(true);
		} else {
			//hash is not ok
			var statuslabel = document.getElementById('status');
			if (socket.readyState == 1) {
				statuslabel.innerHTML = 'Feil passord';
			} else {
				statuslabel.innerHTML = 'Server nede';
			}
		}
		socket.close();
	});
	return false;
}

function runstatus() {
	function isStatusConfirmed() {
		var status = window.localStorage.getItem("status");
		if (status != null) return true;
		return false;
	}
	if (isStatusConfirmed() == true) {
		loadGeneratedStatus();
		window.localStorage.removeItem("status");
		return;
	}
	var hash = window.localStorage.getItem("hash");
	var socket = new WebSocket('ws://'+target, wsprotocol);
	var idletime = 1;
	var maxtime = 5000;
	var hasmessage = false;
	socket.onerror = function(event) {
		console.log('error');
		returnval = "done";
	};
	socket.onopen = function(event) {
		//object must be formatted so that the json output format is correct for rust json
		var msg = {"hash":hash, "action":"RequestStatus"};
		var msgjson = JSON.stringify(msg);
		socket.send(msgjson);
	};
	socket.onmessage = function(event) {
		window.localStorage.setItem("status",event.data);
		hasmessage = true;
		socket.close();
		window.location.reload(true);
	};
	window.setTimeout(function() {
		if(hasmessage) {
			return;
		} else {
			document.getElementById('pContent').innerHTML = "<label>Problem med server. Fikk ingen status</label>";
		}
	}, 2000);
	return false;
}

function loadGeneratedStatus() {
	var hash = window.localStorage.getItem("hash");
	socket = new WebSocket('ws://'+target, wsprotocol);
	socket.onopen = function(event) {
		//object must be formatted so that the json output format is correct for rust json
		var msg = {"hash":hash, "action":"Login"};
		var msgjson = JSON.stringify(msg);
		socket.send(msgjson);
	};
	socket.onmessage = function(event) {
		var statusdata = event.data;
		var obj = JSON.parse(statusdata);
		if (!obj.hasOwnProperty('zones')) {
			//dont care if it is not a status
			return;
		}
		for (i = 0; i < obj.zones.length; i++) {
			var zone = obj.zones[i];
			var tempname = zone.name + '_temp';
			var temp = Math.round(zone.temp*10)/10;
			document.getElementById(tempname).innerHTML = temp;
			var slidername = zone.name + '_slider';
			$('#'+slidername).val(zone.target);
			$('#'+slidername).slider('refresh');
			for (j = 0; j < zone.switches.length; j++) {
				var sw = zone.switches[j];
				var switchid = sw.name + '_switch';
				$('#'+switchid).val(sw.state);
				$('#'+switchid).flipswitch('refresh');
			}
		}
	};
	populate(window.localStorage.getItem("status"));
}

function populate(storedstatus) {
	statushtml = "";
	var obj = JSON.parse(storedstatus);
	for (i = 0; i < obj.zones.length; i++) {
		statushtml += get_zone_html(obj.zones[i]);
	}
	document.getElementById('pContent').innerHTML = statushtml;
}

function get_zone_html(zone) {
	//var zonehtml = '<fieldset data-role="controlgroup" class="ui-widget ui-widget-content"><legend>'+zone.name+'</legend>';
	var zonehtml = '<div id="zonediv"><h2>' + zone.name + '</h4>';
	var slidername = zone.name + '_slider';
	var tempname = zone.name + '_temp';
	var temp = Math.round(zone.temp*10)/10;
	zonehtml += 	'<div data-role="fieldcontain">' +
			'<label for="' + tempname + '">Temperatur</label>' +
			'<p id="' + tempname + '"><label>' + temp + '</label></p>' +
			'<label for="' + slidername + '">Måltemperatur</label>' +
			'<input type="range" name="' + slidername + '" id="' + slidername + '" max="30" min="6" value="' + zone.target + '" data-highlight="true" onchange="sliderchange(this)"/>' +
			'<div>';
	zonehtml += '<br><br>';
	for (i = 0; i < zone.switches.length; i++) {
		zonehtml += get_switch_html(zone.switches[i]);
	}
	zonehtml += '</div>';
	return zonehtml;
}

function get_switch_html(sw) {
	var switchid = sw.name + '_switch';
	var switchhtml = 	'<fieldset>' +
				'<div data-role="fieldcontain" class="no-cursor">' +
				'<label for="' + switchid + '">' + sw.name + '</label>' +
				'<select name="' + switchid + '" id="' + switchid + '" data-role="flipswitch" value="' + sw.state + '" data-disabled="true">';
	if (sw.state == "On") {
		switchhtml += '<option value="Off">Av</option><option value="On" selected="">På</option>';
	} else {
		switchhtml += '<option value="Off" selected="">Av</option><option value="On">På</option>';
	}
	switchhtml +=
			'</select>' +
			'</div>' +
			'</fieldset>';
	return switchhtml;
}

function sliderchange(slider) {
	console.log(slider);
	var zonename = slider.name.substring(0, slider.name.lastIndexOf("_slider"));
	console.log(zonename);
	var action = {"variant":"SetTemp","fields":[{"name":zonename,"temp":slider.value}]};
	var msgobj = {"hash":hash,"action":action};
	var msg = JSON.stringify(msgobj);
	if (socket.readyState == 1) {
		//socket is open. send settemp
		socket.send(msg);
	} else {
		console.log("Server has not been connected.");
		document.getElementById('pContent').innerHTML = "<label>Problem med server. Fikk ingen status</label>";
	}

}
