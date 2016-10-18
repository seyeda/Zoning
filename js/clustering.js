/**
 * Created by shan on 15-03-13.
 */

var headers = undefined;

function run() {
    markers = [];
    var clusteringNeeded = document.getElementById("zoning").checked;
    var file = selectedFile;
    var reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function (event) {
        var csv = event.target.result;
        var data = $.csv.toArrays(csv);
        headers = {}
        for (var i = 0; i < data[0].length; ++i) {
            headers[data[0][i]] = i;
        }
        $(".dial").knob();
        document.getElementById('prog').parentNode.style.display = "inline"
        document.getElementById('prog').style.display = "inline"
        if (!clusteringNeeded) {
            addGeocodes([data, [], 1, headers, gecode_withoutzoning_callback]);
        }
        else {
            addGeocodes([data, [], 1, headers, gecode_withzoning_callback]);
        }
    };
    reader.onerror = function () {
        alert('Unable to read ' + file.fileName);
    };
}

function gecode_withzoning_callback(csvfile_with_geocode, headers){
    document.getElementById('prog').parentNode.style.display = "none"
    document.getElementById('prog').style.display = "none"
    var csvDownload = kmeansClusterDraw(csvfile_with_geocode, parseInt(document.getElementById("ClusterNum").value), headers);
    headers.zone = Object.keys(headers).length;
    setDownloadLink(csvDownload, headers);
}

function gecode_withoutzoning_callback(csvfile_with_geocode, headers){
    document.getElementById('prog').parentNode.style.display = "none"
    document.getElementById('prog').style.display = "none"
    for (var i = 0; i < csvfile_with_geocode.length; ++i) {
        markers.push(drawMarker(csvfile_with_geocode[i].location, csvfile_with_geocode[i].metadata[headers.zone], csvfile_with_geocode[i].metadata[headers.title] + "<br>" + csvfile_with_geocode[i].metadata[headers.address], {
            "metadata": csvfile_with_geocode[i].metadata
        }, headers));
    }
}

function addGeocodes(inputs){ // csvFile, out, end
    var csvFile = inputs[0];
    var out = inputs[1];
    var end = inputs[2];
    var headers = inputs[3];
    var callback = inputs[4];
    if (end == csvFile.length) {
        $('.dial').val(100).trigger('change');
        callback(out, headers);
    }
    else {
        geocoder.geocode({'address': csvFile[end][headers.address]}, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var row = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
                row.metadata = sanitize_csv_row(csvFile[end]);
                row.location = results[0].geometry.location;
                out[out.length] = row;
                $('.dial').val(Math.ceil((end / csvFile.length) * 100)).trigger('change');
                addGeocodes([csvFile, out, ++end, headers, callback]);
            } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                sleep(addGeocodes, inputs, 2500);
            }
            else {
                alert('Geocode for address ' + csvFile[end][headers.address] + ' was not successful due to: ' + status);
            }
        });
    }
}

function kmeansClusterDraw(rows, clusterNum, headers) {
    var clusters = clusterfck.kmeans(rows, clusterNum);
    var zone = 0;
    var csvDownload = []
    for (var i = 0; i < clusters.length; ++i) {
        ++zone;
        for (var j = 0; j < clusters[i].length; ++j) {
            clusters[i][j].metadata.push(zone);
            markers.push(drawMarker(clusters[i][j].location, zone, clusters[i][j].metadata[headers.title] + "<br>" + clusters[i][j].metadata[headers.address], {
                "metadata": clusters[i][j].metadata
            }, headers));
            csvDownload.push(clusters[i][j].metadata);
        }
    }
    return csvDownload

}

function setDownloadLink(csv, headers) {
    var dCSV = csv.join('\n');
    var nextindex = 0;
    var orderedheaders = "";
    while (nextindex < Object.keys(headers).length) {
        for (var key in headers) {
            if (headers[key] == nextindex) {
                orderedheaders += key + ",";
                nextindex++;
                break;
            }
        }
    }
    dCSV = orderedheaders + "\n" + dCSV;

    window.URL = window.webkitURL || window.URL;

    var contentType = 'text/csv';

    var csvFile = new Blob([dCSV], {type: contentType});

    document.getElementById('donlink').download = 'my.csv';
    document.getElementById('donlink').href = window.URL.createObjectURL(csvFile);
    document.getElementById('donlink').dataset.downloadurl = [contentType, document.getElementById('donlink').download, document.getElementById('donlink').href].join(':');
    document.getElementById('donlinkcont').style.display = "inline";
}

function markerToCSV(localMarkers) {
    var res = [];
    for (var i = 0; i < localMarkers.length; ++i) {
        //res.push([localMarkers[i].customInfo.fname, localMarkers[i].customInfo.lname, localMarkers[i].customInfo.address, localMarkers[i].customInfo.email, localMarkers[i].customInfo.tel, localMarkers[i].customInfo.bottle, localMarkers[i].customInfo.coin, localMarkers[i].customInfo.comment, localMarkers[i].customInfo.zone]);
        res.push(localMarkers[i].customInfo.metadata);
    }
    return res;
}

function makeDownloadLinkFromMarkers() {
    setDownloadLink(markerToCSV(markers), headers);

}

function sleep(callback, item, millis) {
    setTimeout(function () {
        callback(item, millis);
    }, millis);
}

var latestListener = null;

function drawMarker(coordinates, region, caption, metadata, header) {
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
            $('#bbt').bind('click', {mar: marker, met: metadata, "header": header}, changeZone)
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

function codeAddress(item, mili) {
    geocoder.geocode({'address': item[2] + " Calgary Canada"}, function (results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            drawMarker(results[0].geometry.location, item[6], item[0].toString() + ' ' + item[1].toString(), item[2]);
        } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
            sleep(codeAddress, item, mili);
        }
        else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}


var markers = [];
var openInforWindow = null;


function changeZone(input) {
    $("#bbt").unbind("click", changeZone);
    var header = input.data.header;
    // 	alert(marker.data.mar.customInfo.fname + " " + marker.data.mar.customInfo.lname);
    input.data.mar.customInfo.metadata[header.zone] = $('#nregion').val();
    drawMarker(input.data.mar.position, $('#nregion').val(), input.data.mar.customInfo.metadata[header.title] + "<br>" + input.data.mar.customInfo.metadata[header.address], input.data.mar.customInfo.metadata);

    input.data.mar.setMap(null);
    document.getElementById('donlinkcont').style.display = "none";

}

//function (inputs) { // csvFile, out, end
//    markers = [];
//    var csvFile = inputs[0];
//    var out = inputs[1];
//    var end = inputs[2];
//    if (end == csvFile.length) {
//        $('.dial').val(100).trigger('change');
//        //         kmeansClusterDraw(out, clusterNum);
//        document.getElementById('prog').parentNode.style.display = "none"
//        document.getElementById('prog').style.display = "none"
//    }
//    else {
//        geocoder.geocode({'address': csvFile[end][2] + " Calgary Canada"}, function (results, status) {
//            if (status == google.maps.GeocoderStatus.OK) {
//                var row = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
//                row.location = results[0].geometry.location;
//                console.log(end);
//                row.fname = csvFile[end][0].toString().replace(/,/g, " ");
//                row.lname = csvFile[end][1].toString().replace(/,/g, " ");
//                row.address = csvFile[end][2].toString().replace(/,/g, " ");
//                row.email = csvFile[end][3].toString().replace(/,/g, " ");
//                row.tel = csvFile[end][4].toString().replace(/,/g, " ");
//                row.bottle = csvFile[end][5].toString().replace(/,/g, " ");
//                row.coin = csvFile[end][6].toString().replace(/,/g, " ");
//                row.comment = csvFile[end][7].toString().replace(/,/g, " ");
//                row.zone = csvFile[end][8].toString().replace(/,/g, " ");
//                markers.push(drawMarker(row.location, row.zone, row.fname + " " + row.lname + "<br>" + row.address, {
//                    "zone": row.zone,
//                    "fname": row.fname,
//                    "lname": row.lname,
//                    "address": row.address,
//                    "email": row.email,
//                    "tel": row.tel,
//                    "bottle": row.bottle,
//                    "coin": row.coin,
//                    "comment": row.comment
//                }));
//                out[out.length] = row;
//
//                //                document.getElementById("prog").value = end.toString();
//
//                $('.dial').val(Math.ceil((end / csvFile.length) * 100)).trigger('change');
//                //                $(function() {
//                //                    $(".dial").knob();
//                //                });
//
//                prepareData([csvFile, out, ++end]);
//            } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
//                sleep(prepareData, inputs, 2500);
//            }
//            else {
//                alert('Geocode was not successful for the following reason: ' + status);
//            }
//        });
//    }
//}

var geocoder;
var map;
var resCSV = null;
$(document).ready(function () {
    if (isAPIAvailable()) {
        $('#files').bind('change', handleFileSelect);
    }
    google.maps.event.addDomListener(window, 'load', initialize);
});

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    selectedFile = files[0];

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
    var latlng = new google.maps.LatLng(51, -114);
    var mapOptions = {
        zoom: 8,
        center: latlng
    }
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
}

function sanitize_csv_row(row){
    for (var i = 0; i < row.length; ++i){
        row[i] = row[i].toString().replace(/,/g, " ");
    }
    return row;
}