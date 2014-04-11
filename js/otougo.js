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

// légende : * data en rt / + horaire calculé
// datas : 
//		velib*/autolib*/parking voiture*/parking 2roues/taxis*/borne de recharge elec/
//		metro+/rer+/
//		covoiturage*/
//		camping/caravane/
//		aeroport+/heliport+/
//		bus+/tram+/

var Otougo = {};

// Liste des différentes datas que l'on pourra importer
Otougo.listData = ["velib", "carpark", "motopark", "pooling"];
