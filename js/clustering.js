/**
* Created by shan on 15-03-13.
*/


function prepareClusterData(inputs){ // csvFile, out, end, clusterNum
  markers = [];
  var csvFile = inputs[0];
  var out = inputs[1];
  var end = inputs[2];
  var clusterNum = inputs[3];
  console.log(end)
  if (end == csvFile.length) {
    $('.dial').val(100).trigger('change');
    kmeansClusterDraw(out, clusterNum);
  }
  else {
    geocoder.geocode( { 'address': csvFile[end][2] + " Calgary Canada"}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var row = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
        row.location = results[0].geometry.location;
        console.log(end);
        row.fname = csvFile[end][0].toString().replace(/,/g, " ");
        row.lname = csvFile[end][1].toString().replace(/,/g, " ");
        row.address = csvFile[end][2].toString().replace(/,/g, " ");
        row.email = csvFile[end][3].toString().replace(/,/g, " ");
        row.tel = csvFile[end][4].toString().replace(/,/g, " ");
        row.bottle = csvFile[end][5].toString().replace(/,/g, " ");
        row.coin = csvFile[end][6].toString().replace(/,/g, " ");
        row.comment = csvFile[end][7].toString().replace(/,/g, " ");
        out[out.length] = row;

        //                document.getElementById("prog").value = end.toString();

        $('.dial').val(Math.ceil((end / csvFile.length) * 100)).trigger('change');
        //                $(function() {
        //                    $(".dial").knob();
        //                });

        prepareClusterData([csvFile, out, ++end, clusterNum]);
      } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
        sleep(prepareClusterData, inputs, 2500);
      }
      else {
        alert('Geocode for address ' + csvFile[end][2] + ' was not successful due to: ' + status);
      }
    });
  }
}


function kmeansClusterDraw(rows, clusterNum){
  var clusters = clusterfck.kmeans(rows, clusterNum);
  var zone = 0;
  var csvDownload = []
  document.getElementById('prog').parentNode.style.display = "none"
  document.getElementById('prog').style.display = "none"
  for (i = 0; i < clusters.length; ++i){
    ++zone;
    for (j = 0; j < clusters[i].length; ++j){
      clusters[i][j].zone = zone;
      markers.push(drawMarker(clusters[i][j].location, zone, clusters[i][j].fname + " " + clusters[i][j].lname + "<br>" + clusters[i][j].address,{ "zone": zone, "fname": clusters[i][j].fname, "lname": clusters[i][j].lname, "address":clusters[i][j].address, "email": clusters[i][j].email, "tel": clusters[i][j].tel, "bottle": clusters[i][j].bottle, "coin": clusters[i][j].coin, "comment": clusters[i][j].comment}));
      csvDownload.push([clusters[i][j].fname, clusters[i][j].lname, clusters[i][j].address, clusters[i][j].email, clusters[i][j].tel, clusters[i][j].bottle, clusters[i][j].coin, clusters[i][j].comment, zone])
    }
  }
  resCSV = csvDownload;
  setDownloadLink(csvDownload);
}

function setDownloadLink(csv) {
  var dCSV = csv.join('\n');
  dCSV = "firstname,lastname,address,email,telephone,bottle,coin,comment,zone\n" + dCSV;

  window.URL = window.webkitURL || window.URL;

  var contentType = 'text/csv';

  var csvFile = new Blob([dCSV], {type: contentType});

  document.getElementById('donlink').download = 'my.csv';
  document.getElementById('donlink').href = window.URL.createObjectURL(csvFile);
  document.getElementById('donlink').dataset.downloadurl = [contentType, document.getElementById('donlink').download, document.getElementById('donlink').href].join(':');
  document.getElementById('donlinkcont').style.display = "inline";
}

function markerToCSV(localMarkers){
  var res = [];
  for (var i = 0; i < localMarkers.length; ++i){
    res.push([localMarkers[i].customInfo.fname, localMarkers[i].customInfo.lname, localMarkers[i].customInfo.address, localMarkers[i].customInfo.email, localMarkers[i].customInfo.tel, localMarkers[i].customInfo.bottle, localMarkers[i].customInfo.coin, localMarkers[i].customInfo.comment, localMarkers[i].customInfo.zone]);
  }
  return res;
}

function makeDownloadLinkFromMarkers(){
  setDownloadLink(markerToCSV(markers));

}

function sleep(callback, item, millis) {
  setTimeout(function() { callback(item,millis); }, millis);
}

var latestListener = null;

function drawMarker(coordinates, region, caption, metadata) {
  //     map.setCenter(coordinates);
  var image = 'icons/number_' + region + '.png';
  var marker = new google.maps.Marker({
    map: map,
    position: coordinates,
    customInfo: metadata,
    icon: image
  });

  var infoWindow = new google.maps.InfoWindow();
  metadata.caption = caption;
  (function (marker, data) {
    google.maps.event.addListener(marker, "click", function (e) {
      //Wrap the content inside an HTML DIV in order to set height and width of InfoWindow.
      //  if (infoWindow) {
      //       	infoWindow.close();
      //   	}
      infoWindow.setContent(data.caption + '<br> <button id="bbt">Move to zone</button> <input type="text" id="nregion">');
      infoWindow.open(map, marker);
      // infoWindow.open(map,marker);
      $('#bbt').bind('click', {mar: marker, met: metadata}, changeZone);
    });
  })(marker, metadata);

  //    latestListener = google.maps.event.addListener(marker, 'click', function() {
  //       if (openInforWindow) {
  //       	openInforWindow.close();
  //  	}

  //        openInforWindow = new google.maps.InfoWindow({
  //       content: caption + '<br> <button id="bbt">Move to zone</button> <input type="text" id="nregion">'
  //  });


  //});
  return marker;
}


function removeElement(id) {
  document.getElementById(id).parentNode.removeChild(elem);
}

function codeAddress(item,mili) {
  geocoder.geocode( { 'address': item[2] + " Calgary Canada"}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
      drawMarker(results[0].geometry.location, item[6], item[0].toString() + ' ' + item[1].toString(), item[2]);
    } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
      sleep(codeAddress,item,mili);
    }
    else {
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}


var markers = [];
var openInforWindow = null;


function changeZone(marker){
  $("#bbt").unbind( "click", changeZone );

  // 	alert(marker.data.mar.customInfo.fname + " " + marker.data.mar.customInfo.lname);
  marker.data.mar.customInfo.zone = $('#nregion').val();
  drawMarker(marker.data.mar.position, $('#nregion').val(), marker.data.mar.customInfo.fname + " " + marker.data.mar.customInfo.lname + "<br>" + marker.data.mar.customInfo.address, marker.data.mar.customInfo);
  marker.data.mar.setMap(null);
  document.getElementById('donlinkcont').style.display = "none";

}

function prepareData(inputs){ // csvFile, out, end
  markers = [];
  var csvFile = inputs[0];
  var out = inputs[1];
  var end = inputs[2];
  console.log(end)
  if (end == csvFile.length) {
    $('.dial').val(100).trigger('change');
    //         kmeansClusterDraw(out, clusterNum);
    document.getElementById('prog').parentNode.style.display = "none"
    document.getElementById('prog').style.display = "none"
  }
  else {
    geocoder.geocode( { 'address': csvFile[end][2] + " Calgary Canada"}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var row = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
        row.location = results[0].geometry.location;
        console.log(end);
        row.fname = csvFile[end][0].toString().replace(/,/g, " ");
        row.lname = csvFile[end][1].toString().replace(/,/g, " ");
        row.address = csvFile[end][2].toString().replace(/,/g, " ");
        row.email = csvFile[end][3].toString().replace(/,/g, " ");
        row.tel = csvFile[end][4].toString().replace(/,/g, " ");
        row.bottle = csvFile[end][5].toString().replace(/,/g, " ");
        row.coin = csvFile[end][6].toString().replace(/,/g, " ");
        row.comment = csvFile[end][7].toString().replace(/,/g, " ");
        row.zone = csvFile[end][8].toString().replace(/,/g, " ");
        markers.push(drawMarker(row.location, row.zone, row.fname + " " + row.lname + "<br>" + row.address,{ "zone": row.zone, "fname": row.fname, "lname": row.lname, "address":row.address, "email": row.email, "tel": row.tel, "bottle": row.bottle, "coin": row.coin, "comment": row.comment}));
        out[out.length] = row;

        //                document.getElementById("prog").value = end.toString();

        $('.dial').val(Math.ceil((end / csvFile.length) * 100)).trigger('change');
        //                $(function() {
        //                    $(".dial").knob();
        //                });

        prepareData([csvFile, out, ++end]);
      } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT){
        sleep(prepareData, inputs, 2500);
      }
      else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  }
}

var geocoder;
var map;
var resCSV = null;
$(document).ready(function() {
  if(isAPIAvailable()) {
    $('#files').bind('change', handleFileSelect);
  }
  google.maps.event.addDomListener(window, 'load', initialize);
});

function handleFileSelect(evt) {
  var files = evt.target.files; // FileList object
  selectedFile = files[0];

}
var st = -1;
function run() {
  addMarkers(selectedFile, document.getElementById("zoning").checked);

}
function addMarkers(file, clusteringNeeded) {
  var reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function (event) {
    var csv = event.target.result;
    var data = $.csv.toArrays(csv);
    if (!clusteringNeeded) {
      $(".dial").knob();
      document.getElementById('prog').parentNode.style.display = "inline"
      document.getElementById('prog').style.display = "inline"
      prepareData([data, [], 1]);
    }
    else{
      $(".dial").knob();
      document.getElementById('prog').parentNode.style.display = "inline"
      document.getElementById('prog').style.display = "inline"
      prepareClusterData([data, [], 1, parseInt(document.getElementById("ClusterNum").value)]);
    }
  };
  reader.onerror = function () {
    alert('Unable to read ' + file.fileName);
  };
}

function isAPIAvailable() {
  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
    return true;
  } else {
    // source: File API availability - http://caniuse.com/#feat=fileapi
    // source: <output> availability - http://html5doctor.com/the-output-element/
    document.writeln('The HTML5 APIs used in this form are only available in the following browsers:<br />');
    // 6.0 File API & 13.0 <output>
    document.writeln(' - Google Chrome: 13.0 or later<br />');
    // 3.6 File API & 6.0 <output>
    document.writeln(' - Mozilla Firefox: 6.0 or later<br />');
    // 10.0 File API & 10.0 <output>
    document.writeln(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
    // ? File API & 5.1 <output>
    document.writeln(' - Safari: Not supported<br />');
    // ? File API & 9.2 <output>
    document.writeln(' - Opera: Not supported');
    return false;
  }
}

function initialize() {
  geocoder = new google.maps.Geocoder();
  var latlng = new google.maps.LatLng(51,-114);
  var mapOptions = {
    zoom: 8,
    center: latlng
  }
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}
