var map = L.map('map').setView([38.246242, 21.7350847], 16);
var simulatedUserLocation = L.latLng(38.246242, 21.7350847);


var greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

var orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});


L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

var layerGroup = L.layerGroup();

layerGroup.addTo(map);

var markersLayer = new L.layerGroup();	
var offersMarkersLayer = new L.layerGroup();


offersMarkersLayer.addTo(map);

var controlSearch = new L.Control.Search({
  position:'topright',		
  layer: markersLayer,
  initial: false,
  zoom: 12,
  marker: false
});

controlSearch.on("search:locationfound", function (e) {
  if (e.layer._popup) e.layer.openPopup();
});

map.addControl( controlSearch );

var categoryFilter = L.control({position: 'topleft'});
        categoryFilter.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'categories');
            div.innerHTML = '<select id="categoryFilter"></select>';
            return div;
};
categoryFilter.addTo(map);

function populateCategoryDropdown(categories) {
  var selectElement = document.getElementById('categoryFilter');

  var allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Categories';
  selectElement.appendChild(allOption);

  categories.forEach(function(category) {
    var option = document.createElement('option');
    option.textContent = category.name;
    selectElement.appendChild(option);
  });
}


var showNoOfferStores = L.control({position: 'topleft'});
        showNoOfferStores.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'showNoOfferStores');
            div.innerHTML = '<form><input id="showNoOfferStores" type="checkbox"/>Show stores without offers</form>';
            return div;
};
showNoOfferStores.addTo(map);

var lc = L.control
  .locate({
    position: "topright",
    setView: true,
    locateOptions: {
      enableHighAccuracy: true
    }
  })
  .addTo(map);

  var loc;
  map.on('locationfound',(e)=>{
    var lat = e.latitude;
    var lng = e.longitude;
    loc = L.latLng(lat,lng);
    searchByAjax();
    map.stopLocate();
})



 


function noOffersShow() {
    $("#showNoOfferStores").on('click', function () {
      if ($(this).is(':checked')) {
          markersLayer.addTo(map);
        
      } else {
        
          markersLayer.removeFrom(map);
       
      }
    });
  }




 

function searchByAjax(){
  offersMarkersLayer.clearLayers();
  markersLayer.clearLayers();
  $.ajax({
    url: '../php/stores.php', 
    type: 'GET',
    dataType: 'json',
    success: function(data) {
      var stores = {};
        data.forEach(function(markerData) {
          var title=markerData.store_name;
          var storeLocation = L.latLng(markerData.latitude, markerData.longitude);
          var storeId = markerData.store_id;
        
          if (!stores[storeId]) {
            stores[storeId] = {
              store_name: markerData.store_name,
              latitude: markerData.latitude,
              longitude: markerData.longitude,
              distance : loc.distanceTo(storeLocation),
              offers: [],
            };
          }

        
          if (markerData.product_name && markerData.price) {
            console.log(`Adding offer to store ${storeId}`);

            stores[storeId].offers.push({
              product_name: markerData.product_name,
              product_category: markerData.category_name,
              price: markerData.price,
              stock: markerData.stock,
              offerId: markerData.offer_id,
              a5ai: markerData.a5ai,
              a5aii: markerData.a5aii
            });
          }

          
           
  });

  

  for (var storeId in stores) {
    var storeData = stores[storeId];

    if(storeData.offers.length > 0) {
      var productCategories = storeData.offers.map(offer => offer.product_category).join(', ');

      var OfferspopupContent = `
        <div class='popup'>
          <h3>${storeData.store_name}</h3>
          <hr>
          ${storeData.offers.map(offer => `
            <p><b>${offer.product_name}</b></p>
            <p>Τιμή: <b> ${offer.price}€ </b> &nbsp; Διαθέσιμο: ${offer.stock} </p>
            <button style = "float: right" id = "del-offer" data-offerid="${offer.offerId}">
            <i class="fa-solid fa-trash" style = "color:red"></i>
            </button>
            <i class="fa-lg fa-solid fa-check" ${offer.a5ai == 1 ? `style =" color:green" ` : ""}></i>
            <i  class="fa-lg fa-solid fa-check-double" ${offer.a5aii == 1 ? `style =" color:green" ` : ""}></i>
            <hr>
          `).join('')}
          ${storeData.distance < 500 ? `
          <button class = "popbtn" id="btn-review" data-storeid="${storeId}" data-toggle="modal" data-target="#exampleModalCenter">Αξιολόγηση</button>
        ` : ''}

          ${storeData.distance < 500 ? `
          <button class = "popbtn" id="btn-new-offer" data-storeid="${storeId}" data-toggle="modal" data-target="#exampleModalCenter">Υποβολή προσφοράς</button>'
          ` :""}
        </div>`;

      var marker = L.marker(
        [storeData.latitude, storeData.longitude],{title: storeData.store_name, icon: orangeIcon , category:productCategories })
        marker.bindPopup(OfferspopupContent)
        offersMarkersLayer.addLayer(marker);


      }
      else {
        var popupContent =  `
        <div class='popup'>
            <h3>${storeData.store_name}</h3>
            ${storeData.distance < 500 ? `
          <button class = "popbtn" id="btn-new-offer" data-storeid="${storeId}" data-toggle="modal" data-target="#exampleModalCenter">Υποβολή προσφοράς</button>'
          ` :""}
        </div>`;

        var marker = L.marker(
          [storeData.latitude,storeData.longitude],{title: storeData.store_name, icon: greenIcon})
          marker.bindPopup(popupContent)
          markersLayer.addLayer(marker);
          map.removeLayer(marker);
        }
  }

        var categories = []; 
      data.forEach(function(storeData) {
        if (!categories.includes(storeData.category_name)) {
          categories.push(storeData.category_name);
        }
      });
      

      populateCategoryDropdown(categories);
    
      document.getElementById('categoryFilter').addEventListener('change', function() {
        var selectedCategory = this.value;

        offersMarkersLayer.eachLayer(function(marker) {
          var markerCategory = marker.options.category; 
          
          if (selectedCategory === 'all' || markerCategory.includes(selectedCategory)) {
            marker.addTo(map);
          } else {
            marker.removeFrom(map);
          }
        });
        
      });
      },

        error: function(jqXHR, textStatus, errorThrown) {
        console.error('AJAX Error:', errorThrown);
    }
  });
  noOffersShow();

}



function populateCategoryDropdown(categories) {
  var selectElement = document.getElementById('categoryFilter');

  var allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Categories';
  selectElement.appendChild(allOption);

  categories.forEach(function(category) {
    var option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    selectElement.appendChild(option);
  });

  }

