//-----------------------------Map stuff---------------------------------
//Tile Provider
var mapbox_streets = new L.tileLayer('https://api.mapbox.com/v4/mapbox.streets/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var mapbox_satellite = new L.tileLayer('https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var mapbox_choropleth = new L.tileLayer('https://api.mapbox.com/v4/mapbox.pencil/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var openstreetmap_mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

//Base map
var baseMaps = {
    "Mapbox Streets": mapbox_streets,
    "Mapbox Satellite": mapbox_satellite,
    "OpenStreetMap Mapnik": openstreetmap_mapnik,
    "Choropleth": mapbox_choropleth,
};

//Initialize map
var map = new L.map('map', {
    center: [20.0, 5.0],
    zoomSnap: 0.25,
    zoom: 2.25,
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

//-----------------------------place marker---------------------------------
var marker;
var markergroup = L.layerGroup();
var loadboundaries;
var drunkcountries = country.length;

for (var i=0; i < markers.length; i++) 
{
    for (var j = 0; j < country.length; j++)
    {
        //compare country names because it is possible that collection contains more countries than markers, don't place a marker if this is the case
        if(markers[i].name === country[j].name)
        {
            //Iterate over all results and add them as markers to a layer group
            marker = L.marker( [markers[i].lat, markers[i].long], {icon: myIcon});
            marker.bindPopup('<i class="fa fa-flag"></i> <a target="_blank" href='+country[j].href+'>'+country[j].name+'</a> <br> <i class="fa fa-slack"></i> '+country[j].anzahl);
            marker.addTo(markergroup);
        }
    }
}
//---------------------------------Choropleth-----------------------------------------
//Load GeoJSON file with country borders
loadboundaries = L.geoJson(worldboundaries, {onEachFeature: onEachFeature});

//throws an error when setStyle is used on L.geoJson so we wait until its ready
loadboundaries.on('ready', loadboundaries.setStyle(function (feature) {
    return {
    fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.7
    };
}));

//coloring the choropleth map
function getColor(d) {
    return d > 1000 ? '#B10026' :
           d > 100  ? '#E31A1C' :
           d > 50   ? '#FC4E2A' :
           d > 30   ? '#FD8D3C' :
           d > 20   ? '#FEB24C' :
           d > 10   ? '#FED976' :
           d > 0    ? '#FFEDA0' :
                      '#FFFFCC';
}

//merge count data from api response so it can be used in getColor
function onEachFeature(feature, layer) {
    feature.properties.density = 0;
        for (i in country) {
            if(country[i].name === feature.properties.name_de) {
                feature.properties.density = parseInt(country[i].anzahl);
            }
        }
        layer.bindPopup('<i class="fa fa-flag"></i> '+feature.properties.name_de+'<br> <i class="fa fa-slack"></i> '+feature.properties.density);
}

//legend when choropleth is displayed
var legend = L.control({position: 'bottomright'});

//legend for choropleth explaining color codes
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [1, 10, 20, 30, 50, 100, 1000],
    labels = [];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
        '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};
//-----------------------------Choropleth end----------------------------------
        
//Calculate sum of all beers
var sum = 0;
for( var i = 0; i < country.length; i++ ) 
{
    sum += parseInt(country[i].anzahl);
}
$( "#stats" ).html( '<i class="fa fa-folder-open">&nbsp;</i>Biere im Wiki: ' + sum +'<br> <i class="fa fa-globe">&nbsp;</i>Ertrunkene Länder: ' + drunkcountries + '<br>');

//Display marker group on initial load
map.on('load', markergroup.addTo(map));

//If selected layer is "Choropleth" display GeoJSON file
map.on('baselayerchange', baseLayerChange);


function baseLayerChange(event){
    if (event.name == 'Choropleth') {
        map.removeLayer(markergroup);
        map.addLayer(loadboundaries);
        legend.addTo(map);
    }
    else{
        map.removeLayer(loadboundaries);
        map.addLayer(markergroup);
        legend.remove(map);
        }
};

//Modal content
function makeChart() {  
    var ctx = document.getElementById("myChart");
    var data = [];
    var labels = [];
    //Sort style array descending by anzahl and cut off after 10 elements afterwards
    style.sort(function(a, b) {
      return parseInt(b.anzahl) - parseInt(a.anzahl);
    });
    var styletop10 = style.slice(0,10);
    for(var i = 0; i < styletop10.length; i++)
        {
            data.push(parseInt(styletop10[i].anzahl) );
            labels.push(styletop10[i].name );
        }
    var myPieChart = new Chart(ctx,{
      type: 'horizontalBar',
      data:{
        labels: labels,
        datasets: [{
            label: labels,
            //See https://google.github.io/palette.js/
            //Tol's qualitative palette
            //backgroundColor: ["rgb(51, 34, 136)","rgb(136, 204, 238)","rgb(68, 170, 153)","rgb(17, 119, 51)","rgb(153, 153, 51)","rgb(221, 204, 119)","rgb(102, 17, 0)","rgb(204, 102, 119)","rgb(136, 34, 85)","rgb(170, 68, 153)"],
            //Tol's Sequential palette
            //backgroundColor: ["rgb(102, 36, 4)","rgb(146, 48, 4)","rgb(194, 68, 6)","rgb(229, 97, 12)","rgb(247, 134, 28)","rgb(253, 174, 97)","rgb(255, 206, 101)","rgb(255, 231, 152)","rgb(255, 247, 197)","rgb(255, 255, 228)"],
            //Tol's Rainbow palette
            backgroundColor: ["rgb(120, 28, 129)","rgb(67, 50, 141)","rgb(65, 111, 184)","rgb(81, 156, 184)","rgb(112, 180, 132)","rgb(195, 186, 69)","rgb(224, 162, 57)","rgb(255, 231, 152)","rgb(230, 107, 45)","rgb(165, 0, 38)"],
            data: data
        }],
      },
      options: {
        responsive:true,
        maintainAspectRatio: false,
        title: {
            display: true,
            text: 'Biersorten Top 10'
        },
        legend: {display: false},
        tooltips: {
            callbacks: {
                    label: function(tooltipItem) {
                        return tooltipItem.xLabel;
                    }
            }
        }
    }
  });
};

//Only render the chart when modal gets clicked
$(document).ready(function() {
    var clickLink = document.getElementById("modal-link");
    clickLink.addEventListener('click', makeChart);
});