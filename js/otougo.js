// TODO:

// Charger la liste des marqueurs visibles
// Ajouter les partages sur les marqueurs
// Calculer le trajet GPS jusqu'a un marqueur
// Quand un marqueur est déplacé, on relance le calcul du tracé
// Pouvoir ajouter un marqueur de destination
// Ajouter une interface et n'afficher que les marqueurs disponibles dans un rayon choisi (en temps/km/etc)
// Ajouter lien vers datas RT, charger après le load des datas affichable (gain sur la selection)
// Prefixer toutes les propriétés CSS3 cross browser
// Permettre l'ajout d'un marqueur de destination autre que les marqueurs de datas et le here
// Ajout de géocodage pour trouver une adresse plus facilement
// Lorsque le trajet est calculé, mettre un icone qui permet d'afficher le trajet dans sa totalité, zoom si besoin
// Ajout un point de rendez vous pour parker son véhicule et mémoriser le point, permettre de prendre une photo de la place de parking pour que ce soit plus précis.
// Ajout du tracking de la position GPS en cours.
// Clean des marqueurs sur la date de dernière mise à jour.

// légende : * data en rt / + horaire calculé
// datas : 
//		velib*/autolib*/parking voiture*/parking 2roues/taxis*/borne de recharge elec/
//		metro+/rer+/train+
//		covoiturage*/
//		camping/caravane/
//		aeroport+/heliport+/
//		bus+/tram+/

/* BUGS 
 *
 * Quand on met un marqueur, qu'on le déplace, dès qu'on zoom, sa position n'est plus valide.
 * 
 * */
/*
OSRM.RoutingGeometry = {

// show route geometry - if there is a route
show: function(response) {
	var geometry = OSRM.RoutingGeometry._decode(response.route_geometry, OSRM.C.PRECISION );

	OSRM.G.route.showRoute(geometry, OSRM.Route.ROUTE);
},

//show route geometry - if there is no route
showNA: function() {
	var positions = [];
	for(var i=0, size=OSRM.G.markers.route.length; i<size; i++)
		positions.push( OSRM.G.markers.route[i].getPosition() );

	OSRM.G.route.showRoute(positions, OSRM.Route.NOROUTE);
},
*/
//decode compressed route geometry

//};



var Otougo = {};

// Liste des différentes datas que l'on pourra importer
Otougo.listData = ["velib", "carpark", "motopark", "pooling"];

// La position courante
Otougo.position = {};
Otougo.destination = {};
Otougo.locate = null;

// Les options par défaut
Otougo.options = {};
Otougo.options.zoom = 17;
Otougo.options.route_geometry_precision = 6;

// Liste des fonctions pour les events
Otougo.events = {};

// Liste des fonctions statiques
Otougo.static = {};

// handles pour la position GPS du tracé
Otougo.handles = {};
Otougo.handles.start = null;
Otougo.handles.startElement = null;
Otougo.handles.end = null;
Otougo.handles.endElement = null;

// Liste des marqueurs de références
Otougo.markers = {};
Otougo.markers.list = [];

// Liste des différents overlay affichables
Otougo.overlay = {};
Otougo.overlay.list = [];

Otougo.getLocation = function(callback) {
	var that = this;
	if(navigator.geolocation) {
		var survId = navigator.geolocation.getCurrentPosition(
			function(position) {
				that.position.latitude = position.coords.latitude;
				that.position.longitude = position.coords.longitude;
				that.position.altitude = position.coords.altitude;
				if (typeof callback == "function") {
					callback();
				}
			}, 
			function(error) {
			    var info = "Erreur lors de la géolocalisation : ";
			    switch(error.code) {
				    case error.TIMEOUT: info += "Timeout !"; break;
				    case error.PERMISSION_DENIED: info += "Vous n’avez pas donné la permission"; break;
				    case error.POSITION_UNAVAILABLE: info += "La position n’a pu être déterminée"; break;
				    case error.UNKNOWN_ERROR: info += "Erreur inconnue"; break;
			    }
				console.log(info);
			},
			{
				maximumAge:600000
			});
	}
	else {
	  // Pas de support, proposer une alternative ?
	}
};


// Fonction de démarrage après la géolocalisation
Otougo.start = function() {
	this.static.createMarkers();
	this.createMap();

	// Map events
	this.map.on("click", this.events.onMapClick);
	this.map.on("postrender", this.events.onMapDragStart);
	this.map.on("moveend", this.events.onMapDragEnd);
	
	// url de geocodage
	// "http://nominatim.openstreetmap.org/reverse?format=json&json_callback=OSRM.JSONP.callbacks.reverse_geocoder_target&accept-language=fr&lat=49.443017&lon=1.096487"
	// Res: OSRM.JSONP.callbacks.reverse_geocoder_target({"place_id":"18343782","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright","osm_type":"node","osm_id":"1672665046","lat":"49.442704","lon":"1.096505","display_name":"Toto, Rue de l'H\u00f4pital, Quartier Vieux-March\u00e9 Cath\u00e9drale, Ruan, Rouen, Seine-Maritime, Haute-Normandie, France m\u00e9tropolitaine, 76000;76100, France","address":{"address29":"Toto","pedestrian":"Rue de l'H\u00f4pital","suburb":"Quartier Vieux-March\u00e9 Cath\u00e9drale","city":"Ruan","county":"Rouen","state":"Haute-Normandie","postcode":"76000;76100","country":"France","country_code":"fr"}})
	// http://nominatim.openstreetmap.org/reverse?format=json&json_callback=OSRM.JSONP.callbacks.reverse_geocoder_source&accept-language=fr&lat=49.449577&lon=1.073448
	// Res: OSRM.JSONP.callbacks.reverse_geocoder_source({"place_id":"38414114","licence":"Data \u00a9 OpenStreetMap contributors, ODbL 1.0. http:\/\/www.openstreetmap.org\/copyright","osm_type":"way","osm_id":"25215042","lat":"49.4500515","lon":"1.0737843","display_name":"Rue du Framboisier, Quartier Pasteur, Ruan, Rouen, Seine-Maritime, Haute-Normandie, France m\u00e9tropolitaine, 76000;76100","address":{"road":"Rue du Framboisier","suburb":"Quartier Pasteur","city":"Ruan","county":"Rouen","state":"Haute-Normandie","postcode":"76000;76100","country_code":"fr"}})
	
};

Otougo.createMap = function() {
	var layer = new ol.layer.Tile({ source: new ol.source.OSM()});
	this.map = new ol.Map({
		controls: ol.control.defaults(),
		layers: [layer],
		target: 'map',
		view: new ol.View2D({
			center: ol.proj.transform([this.position.longitude, this.position.latitude], 'EPSG:4326', 'EPSG:3857'),
			zoom: 14
		})
	});
};


// Fonction statiques
// *********************************************************************************

Otougo.closeAll = function() {
	// Fenêtre des settings
	$("#div_settings").hide();

	// Fenêtre des choix
	$("#search #back").find("a").removeClass("active");
	$("#search #dataset").hide();
	
	// Fenêtre de dialogue
	$("#div_dialog").hide();
	
	// Fenêtre de tracé GPS 
	$("#div_route").hide();
};

// Creation des différents marqueurs affichables
Otougo.static.createMarkers = function () {
	// Marqueur de position courante
	Otougo.markers.list["here"] = {};
	Otougo.markers.list["here"].url = "images/here.png";
	Otougo.markers.list["here"].iconSize = [40, 40];

	// Marqueur de position de fin
	Otougo.markers.list["end"] = {};
	Otougo.markers.list["end"].url = "images/endflag.png";
	Otougo.markers.list["end"].iconSize = [50, 54];

	Otougo.markers.list["default"] = {};
	Otougo.markers.list["default"].green = "images/default-green.png";
	Otougo.markers.list["default"].orange = "images/default-orange.png";
	Otougo.markers.list["default"].red = "images/default-red.png";
	Otougo.markers.list["default"].blue = "images/default-blue.png";
	Otougo.markers.list["default"].iconSize = [25, 41];
	
	Otougo.markers.list["velib"] = {};
	Otougo.markers.list["velib"].green = "images/cycle-green.png";
	Otougo.markers.list["velib"].orange = "images/cycle-orange.png";
	Otougo.markers.list["velib"].red = "images/cycle-red.png";
	Otougo.markers.list["velib"].blue = "images/cycle-blue.png";
	Otougo.markers.list["velib"].iconSize = [52, 39];
	
	Otougo.markers.list["carpark"] = {};
	Otougo.markers.list["carpark"].green = "images/parkingcar-green.png";
	Otougo.markers.list["carpark"].orange = "images/parkingcar-orange.png";
	Otougo.markers.list["carpark"].red = "images/parkingcar-red.png";
	Otougo.markers.list["carpark"].blue = "images/parkingcar-blue.png";
	Otougo.markers.list["carpark"].iconSize = [55, 55];
	
	Otougo.markers.list["motopark"] = {};
	Otougo.markers.list["motopark"].green = "images/parkingmoto-green.png";
	Otougo.markers.list["motopark"].orange = "images/parkingmoto-orange.png";
	Otougo.markers.list["motopark"].red = "images/parkingmoto-red.png";
	Otougo.markers.list["motopark"].blue = "images/parkingmoto-blue.png";
	Otougo.markers.list["motopark"].iconSize = [55, 55];
	
	Otougo.markers.list["pooling"] = {};
	Otougo.markers.list["pooling"].green = "images/pooling-green.png";
	Otougo.markers.list["pooling"].orange = "images/pooling-orange.png";
	Otougo.markers.list["pooling"].red = "images/pooling-red.png";
	Otougo.markers.list["pooling"].blue = "images/pooling-blue.png";
	Otougo.markers.list["pooling"].iconSize = [52, 30];
};

// Permet de réinitialiser un handle spécifique
Otougo.static.unsetHandle = function(type) {
	if (type == "start") {
		Otougo.handles.start = null;
		Otougo.handles.startElement = null;
	}
	else if (type == "end") {
		Otougo.handles.end = null;
		Otougo.handles.endElement = null;
	}
};

// Permet de réinitialiser un handle spécifique
Otougo.static.setHandle = function(marker, type, handle) {
	if (type == "start") {
		Otougo.handles.start = handle;
		Otougo.handles.startElement = marker;
		$(marker).attr("src", Otougo.markers.list["start"].url);
		$(marker).addClass("start");
		$(marker).removeClass("end");
	}
	else if (type == "end") {
		Otougo.handles.end = handle;
		Otougo.handles.endElement = marker;
		$(marker).attr("src", Otougo.markers.list["end"].url);
		$(marker).addClass("end");
		$(marker).removeClass("start");
	}
	Otougo.static.calculateRoute();
};

Otougo.static.loadMarker = function() {
	// TODO getBounds() pour d 
	// limité à d < 20000m
	// t => dernier delai modification depuis cette là
	// type = train / velo / 

	// récupère le centre de la carte
	console.log(Otougo.map.getView().getCenter());

    $.getJSON("//app.otougo.com/get-marker.php?la=" + Otougo.position.latitude + "&lo=" + Otougo.position.longitude + "&d=5000" , function(data) {
        console.log(data);
    });
};

Otougo.static.getGeocoding = function(lat, lng) {
    $.getJSON("//nominatim.openstreetmap.org/reverse?format=json&json_callback=OSRM.JSONP.callbacks.reverse_geocoder_target&accept-language=fr&lat=" + lat + "&lon=" + lng , function(data) {
        console.log(data);
    });
};

Otougo.static.createMarker = function(type, data) {
	var element=  $('<img class="' + type + '" src="' + Otougo.markers.list[data].url + '">').css({marginTop: '-150%', marginLeft: '-50%', cursor: 'pointer'});
  	element.bind("click", function(e) {
  	    if ($(this).hasClass('noclick')) {
	        $(this).removeClass('noclick');
	        return false;
	    }
  		
		var el = this;
		var size = parseInt($(this).width()) / 2;
		$("#div_dialog").css("top", $(this).offset().top);
		$("#div_dialog").css("left", $(this).offset().left + size);
		$("#div_dialog").show();
		
		$("#div_dialog .endpoint").unbind("click");
		$("#div_dialog .endpoint").bind("click", function() {
			if (!$(el).hasClass("end")) {
				Otougo.events.onMarkerAction(el, "endpoint", Otougo.handles.start);
			}
		});

		$("#div_dialog .delete").unbind("click");
		$("#div_dialog .delete").bind("click", function() {
			if ($(el).hasClass("start")) {
				Otougo.events.onMarkerAction(el, "delete", Otougo.handles.start);
			}
			else {
				Otougo.events.onMarkerAction(el, "delete", Otougo.handles.end);
			}
		});
	}).draggable({
		start: function(e) {
			$(this).addClass('noclick');
			Otougo.closeAll();
		},
		stop: function(e) {
			Otougo.static.calculateRoute();
		}
	});
	return element;
};

Otougo.static.createMarkerRoute = function(type, url) {
	var element=  $('<img class="' + type + '" src="' + url + '">').css({marginTop: '-150%', marginLeft: '-50%', cursor: 'pointer'});
	return element;
};

Otougo.static.calculateRoute = function() {
	// On va vérifier qu'on à bien nos 2 points de liaison
	if (Otougo.handles.start == null || Otougo.handles.end == null) {
		return false;
	}

	// Calcul des données du tracé 
	// http://router.project-osrm.org/viaroute?z=14&output=json&jsonp=OSRM.JSONP.callbacks.route&loc=49.449490,1.073742&loc=49.443017,1.096487&instructions=true
	// Res: OSRM.JSONP.callbacks.route({"status":0,"status_message": "Found route between points","route_geometry": "qedi}Aoqo`A`IbFz{AnfAtu@{~Dr{@kcCwTwSxxDgaMssCq_B~`CkwSpq@nR","route_instructions": [["10","Rue du Framboisier",19,0,5,"19m","SW",205],["1","Rue Jean Ango",184,1,16,"184m","SW",206],["7","Rue de Constantine",429,2,38,"429m","SE",114],["7","Rue du Pré de la Bataille",45,4,6,"45m","NE",32],["3","Rue du Contrat Social",617,5,82,"617m","SE",122],["7","D 938",288,6,31,"288m","NE",23],["3","Rue Jean Lecanuet",805,7,146,"805m","SE",139],["3","Rue des Arsins",92,8,9,"92m","S",192],["15","",0,9,0,"","N",0.0]],"route_summary":{"total_distance":2484,"total_time":349,"start_point":"Rue du Framboisier","end_point":"Rue des Arsins"},"alternative_geometries": ["qedi}Aoqo`A`IbFz{AnfAtu@{~Dr{@kcCygAudAbOgh@qe@_[_CsUaMyaAwg@sp@lH{gBbi@tJtCiwAaMhGjDshAqMmHve@ehFdi@qJwYu`DlL_Hxn@yYj|A|u@tx@kuHpq@nR"],"alternative_instructions":[[["10","Rue du Framboisier",19,0,5,"19m","SW",205],["1","Rue Jean Ango",184,1,16,"184m","SW",206],["7","Rue de Constantine",429,2,38,"429m","SE",114],["7","Rue du Pré de la Bataille",152,4,22,"152m","NE",32],["3","Rue Prosper Soyer",55,5,8,"55m","SE",121],["7","Rue Achille Flaubert",75,6,10,"75m","NE",27],["11-1","Rue Achille Flaubert",81,8,11,"81m","E",72],["1","Rue Henri Barbet",93,9,10,"93m","NE",67],["2","Rue Nicolas Mesnager",122,10,17,"122m","E",98],["3","Rue Jean Revel",76,11,11,"76m","S",190],["7","Rue Louis Aubert",105,12,15,"105m","E",105],["7","Rue Saint-Gervais",26,13,2,"26m","N",339],["4","Rue du Roi",85,14,9,"85m","E",96],["7","Rue Crevier",28,15,2,"28m","NE",23],["3","Rue Guy de Maupassant",278,16,30,"278m","E",106],["3","Rue Saint-Maur",76,17,8,"76m","S",170],["7","Rampe du Bouvreuil",193,18,17,"193m","E",75],["2","Rue Bouquet",26,19,2,"26m","SE",156],["1","Rue Alain Blanchard",93,20,17,"93m","S",165],["3","Rue Jeanne d'Arc",177,21,32,"177m","S",201],["7","Rue Jean Lecanuet",373,22,67,"373m","E",106],["3","Rue des Arsins",92,23,9,"92m","S",192],["15","",0,24,0,"","N",0.0]]],"alternative_summaries":[{"total_distance":2888,"total_time":382,"start_point":"Rue du Framboisier","end_point":"Rue des Arsins"}],"route_name":["Rue du Contrat Social","Rue Jean Lecanuet"],"alternative_names":[["Rue de Constantine","Rue Guy de Maupassant"]],"via_points":[[49.449577,1.073448],[49.442949,1.096777]],"via_indices":[0,79],"alternative_indices":[0,83],"hint_data": {"checksum":0, "locations": ["ly_SE3-CJAA0AAAAEQAAAMIgTs5F4-c_aYryAihhEAA", "npT8E-PzJABDAAAARAAAACrHy6Mhot8_hXDyAkm8EAA"]}})
	var startpos = {};
	var endpos = {};
	
	var newCoords = ol.proj.transform(Otougo.handles.start.getPosition(), 'EPSG:3857', 'EPSG:4326');
	startpos.lat = newCoords[1];
	startpos.lng = newCoords[0];

	var newCoords = ol.proj.transform(Otougo.handles.end.getPosition(), 'EPSG:3857', 'EPSG:4326');
	endpos.lat = newCoords[1];
	endpos.lng = newCoords[0];

	var url = "//router.project-osrm.org/viaroute?z=" + Otougo.map.getView().getZoom() + "&output=json&jsonp=OSRM.JSONP.callbacks.route&loc=" + startpos.lat + "," + startpos.lng + "&loc=" + endpos.lat + "," + endpos.lng + "&instructions=true";    
    $.ajax(url, {dataType:"jsonp", jsonp:"jsonp", cache: true}).success(function(data) {
    	if (data.status == 0) {
    		//console.log(data.route_instructions);
    		
    		var route = Otougo.static.decodeGeometry(data.route_geometry, Otougo.options.route_geometry_precision);
    		
    		for (var i = 0; i < route.length;i++) {
    			var element = Otougo.static.createMarkerRoute("gps_route", Otougo.markers.list["default"].orange);
				handle = new ol.Overlay({
					position: ol.proj.transform([route[i][1], route[i][0]], 'EPSG:4326', 'EPSG:3857'),
				  	element: element
				});
				Otougo.map.addOverlay(handle);
    		}
    		
	    	$("#div_route .content").html("eeeeeee");
	    	$("#div_route").show();
    	}
    });
};

Otougo.static.decodeGeometry = function(encoded, precision) {
	precision = Math.pow(10, -precision);
	var len = encoded.length, index=0, lat=0, lng = 0, array = [];
	while (index < len) {
		var b, shift = 0, result = 0;
		do {
			b = encoded.charCodeAt(index++) - 63;
			result |= (b & 0x1f) << shift;
			shift += 5;
		} while (b >= 0x20);
		var dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
		lat += dlat;
		shift = 0;
		result = 0;
		do {
			b = encoded.charCodeAt(index++) - 63;
			result |= (b & 0x1f) << shift;
			shift += 5;
		} while (b >= 0x20);
		var dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
		lng += dlng;
		//array.push( {lat: lat * precision, lng: lng * precision} );
		array.push( [lat * precision, lng * precision] );
	}
	return array;
};

// Events
// *********************************************************************************
Otougo.events.onMapDragStart = function(e) {
	Otougo.closeAll();
};

Otougo.events.onMapDragEnd = function(e) {
	var zoom = Otougo.map.getView().getZoom();
	if (zoom != Otougo.options.zoom) {
		Otougo.static.calculateRoute();
		Otougo.options.zoom = zoom;
	}
};

Otougo.events.onMarkerAction = function(marker, action, handle) {
	switch(action) {
		case "endpoint":
			if (Otougo.handles.endElement != null) {
				Otougo.events.onMarkerAction(Otougo.handles.endElement, "delete");
			}
			Otougo.static.setHandle(marker, "end", handle);
			Otougo.static.unsetHandle("start");

			Otougo.static.calculateRoute();
			break;
		case "delete":
			if ($(marker).hasClass("start")) {
				Otougo.static.unsetHandle("start");
			}
			else {
				Otougo.static.unsetHandle("end");
			}
			$(marker).remove();
			break;
	}
	$("#div_dialog").hide();
};

Otougo.events.onMapClick = function(e) {
	Otougo.closeAll();
	
	var handle = Otougo.handles.start;
	if (handle != null) {
		Otougo.events.onMarkerAction(Otougo.handles.startElement, "delete");
		Otougo.static.unsetHandle("start");
	}
	var element = Otougo.static.createMarker("start", "here");
	handle = new ol.Overlay({
		position: e.coordinate,
	  	element: element
	});
	Otougo.map.addOverlay(handle);
	Otougo.handles.start = handle;
	Otougo.handles.startElement = element;

	Otougo.static.calculateRoute();

	/*
	// Geocoding pour récupérer adresse physique 
	var newCoords = ol.proj.transform(e.coordinate, 'EPSG:3857', 'EPSG:4326');
	Otougo.position.latitude = newCoords[1];
	Otougo.position.longitude = newCoords[0];
	
	Otougo.getGeocoding(Otougo.position.latitude, Otougo.position.longitude);
	*/
};

$(document).ready(function() {
	$("#search #back").bind("click", function() {
		$(this).closest("#search").find("#dataset").toggle();
	});

	$("#settings").bind("click", function() {
		$("#div_settings").toggle();
	});
	
	$("#div_settings #reset").bind("click", function() {
		Otougo.resetPosition();
	});
	
	$("#div_settings #actual").bind("click", function() {
		console.log(Otougo.position.latitude);
		Otougo.events.onMapClick();
	});

	$("#div_settings .route").bind("click", function() {
		Otougo.closeAll();
		$("#div_route").show();
	});

	$("#div_route .close").bind("click", function() {
		Otougo.closeAll();
		$("#div_route").hide();
	});

	Otougo.getLocation(function() {
		Otougo.start();
	});
});
