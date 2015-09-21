//-----------------------------Map stuff---------------------------------
//Tile Provider
var mapbox_streets = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/duenni.847e1c91/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var mapbox_satellite = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/duenni.ng3a7ocm/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var mapbox_choropleth = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/duenni.ngild633/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var openstreetmap_mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

var hydda_base = L.tileLayer('http://{s}.tile.openstreetmap.se/hydda/base/{z}/{x}/{y}.png', {
	attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

//Base map
var baseMaps = {
    "Mapbox Streets": mapbox_streets,
    "Mapbox Satellite": mapbox_satellite,
    "Choropleth": mapbox_choropleth,
    "OpenStreetMap Mapnik": openstreetmap_mapnik,
    "Hydda Base": hydda_base
};

//Initialize map
var map = new L.map('map', {
    center: [20.0, 5.0],
    zoom: 2,
    worldCopyJump: true,
    layers: [mapbox_streets]
});

//Add Layer switcher to map
L.control.layers(baseMaps, null, {position: 'topleft'}).addTo(map);

//Change marker icon
var myIcon = L.icon({
    iconUrl: './images/bier24.png',
    iconRetinaUrl: './images/bier48.png',
    iconSize: [24, 24],
});

//-----------------------------EasyButton---------------------------------
//EasyButton Wiki
L.easyButton('fa fa-beer', 
    function (){
        window.open('http://www.massafaka.at/massawiki/doku.php?id=bierstats:uebersicht');
    },
 'Bieruebersicht'
).addTo(map);

//EasyButton Github
L.easyButton('fa fa-github', 
    function (){
        window.open('https://github.com/duenni/beermap');
    },
    'Github'
).addTo(map);

//EasyButton more stats
L.easyButton('fa fa-bar-chart', 
    function (){
        $('#modal-link')[0].click();
    },
    'More stats'
).addTo(map);

//-----------------------------Kimono---------------------------------
//Use kimonolabs for scraping 
$.ajax({
    "url":"https://www.kimonolabs.com/api/6qium7f6?apikey="+apikey.kimonolabs,
    "crossDomain": true,
    "dataType": "jsonp",
    //Make a call to the Kimono API following the "url" 

    'success': function(response){ 
    // If the call request was successful and the data was retrieved, this function will create a list displaying the data
 
        var collection = response.results.bierherkunft;
        for (var i=0; i < markers.length; i++) 
        {
            for (var i = 0; i < collection.length; i++)
            {   
                L.marker( [markers[i].lat, markers[i].long], {icon: myIcon})
                .bindPopup('<i class="fa fa-flag"></i> <a target="_blank" href='+collection[i].name.href+'>'+collection[i].name.text+'</a> <br> <i class="fa fa-slack"></i> '+collection[i].anzahl)
                .addTo(map);
            }
        }
        //Calculate sum of all beers
        var sum = 0;
        for( var i = 0; i < collection.length; i++ ) 
        {
            sum += parseInt(collection[i].anzahl);
        }
        $( "#sum" ).html( '<i class="fa fa-folder-open">&nbsp;</i>Biere im Wiki: ' + sum );
    }
}); 

//Modal content
function makeChart() {  
    $.ajax({
        url:"https://www.kimonolabs.com/api/ba3gx8yk?apikey="+apikey.kimonolabs,
        crossDomain: true,
        dataType: "jsonp",
        success: function (response) {
            //If calling the API was successful create a canvasjs chart
            var collection = response.results.biersorten;
            var finals = [];
            for(var i = 0; i < collection.length; i++)
            {
                finals.push({ 'y': parseInt(collection[i].anzahl), 'label': collection[i].sorte.text, 'link': collection[i].sorte.href });
            }
                    
            var chart = new CanvasJS.Chart("chartContainer",{
                animationEnabled: true,
                title:{
                    text: "Biersorten"
                },
                
                data: [
                {
                    type: "pie",
                    toolTipContent: '<a target="_blank" href={link}>{label}</a> <br> Anzahl: {y}',
                    dataPoints: finals
                }
                ]
            });
            chart.render();
        },
        error: function (xhr, status) {
            //handle errors
        }
    });
}

//Only render the chart when modal gets clicked
$(document).ready(function() {
    var clickLink = document.getElementById("modal-link");
    clickLink.addEventListener('click', makeChart);
});