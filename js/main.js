$("#addrowbutton").click(function () {
    $('#csvtable tr:last').after('<tr><td><button title="Delete this row" type="button" onclick="deleterow(this)"><i class="deleterow fa fa-trash" aria-hidden="true"></i></button></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
    $('#csvtable').editableTableWidget();
});

$("#makedownloadbutton").click(function () {
    makeDownloadLinkFromMarkers();
});

$("#runzoningbutton").click(function () {
    var clusteringNeeded = $("#zoning").prop('checked');
    if (!clusteringNeeded) {
        alertify.log("Note that there must be a field 'zone' in the above table.");
    }
    else {
        alertify.log("Note that you are asking the app to distribute addresses to zones. There must not be a field 'zone' in the above table.");
    }


    $('#donlinkcont').hide();
    var table_array = table_to_array($("#csvtable"));
    table_array.rows.unshift(table_array.header);

    startzoning(table_array.rows, clusteringNeeded);
});

$("#importcsv").click(function () {
    reset_table();
    importcsv();
});


$('#csvtable').editableTableWidget();
$('#zoning').change(function () {
    if (this.checked) {
        $("#ClusterNum").prop('disabled', false);
    }
    else
        $("#ClusterNum").prop('disabled', true);
});

function reset_table(){
    var table_initial_content = '<tr id="headerrow" class="table-info"> <th></th> <th>title</th> <th>address</th>' +
        '<td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td>' +
        '<td></td> <td></td> </tr> <tr id="firstrow"> <td> <button title="Delete this row" type="button">' +
        '<i class="deleterow fa fa-trash" aria-hidden="true" onclick="deleterow(this)"></i> </button> </td> <td></td>' +
        '<td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td>' +
        '<td></td><td></td> <td></td></tr>';
    $('#csvtable').html(table_initial_content);
}

function importcsv() {
    event.preventDefault();
    if ((typeof selectedFile === 'undefined') || (selectedFile === undefined) || (selectedFile == null)) {
        console.log("file not selected for import");
        alertify.error("You have to select a file.");
    }
    else {
        var file = selectedFile;
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = function (event) {
            var csv = event.target.result;
            var data = $.csv.toArrays(csv);
            array_to_table(data)
        };
        reader.onerror = function () {
            alert('Unable to read ' + file.fileName);
            alertify.error('Unable to read ' + file.fileName);
        };
    }
}

function array_to_table(csvarray) {
    if (csvarray[0].length > 15) {
        console.log("too many headers");
        alertify.error('You can have at most 15 columns in your csv file.');
        return;
    }
    var headers = {};
    var ordered_headers = ['title', 'address'];
    for (var i = 0; i < csvarray[0].length; ++i) {
        if (csvarray[0][i] == 'title')
            headers.title = i;
        else if (csvarray[0][i] == 'address')
            headers.address = i;
        if (('title' in headers) && ('address' in headers))
            break;
    }
    if (!('title' in headers) || !('address' in headers)) {
        console.log("title and/or address column(s) are missing");
        alertify.error('Make sure your csv header row contains title and address fields.');
        return;
    }
    var headercells = $('#headerrow').find("td");
    var j = 0;
    for (var i = 0; i < csvarray[0].length; ++i) {
        if ((csvarray[0][i] == "title") || (csvarray[0][i] == "address"))
            continue;
        $(headercells[j++]).text(csvarray[0][i]);
        ordered_headers.push(csvarray[0][i]);
        headers[csvarray[0][i]] = i;
    }

    var rows = "";
    for (var i = 1; i < csvarray.length; ++i) {
        var row = ""
        for (var j = 0; j < ordered_headers.length; ++j) {
            row = row + "<td>" + csvarray[i][headers[ordered_headers[j]]] + "</td>";
        }
        for (var j = ordered_headers.length; j < 15; ++j)
            row = row + "<td></td>";
        row = '<tr><td><button title="Delete this row" type="button" onclick="deleterow(this)"><i class="deleterow fa fa-trash" aria-hidden="true"></i></button>' + row + '</tr>';
        rows = rows + row;
    }
    $('#csvtable tr:first').after(rows);
    $('#csvtable').editableTableWidget();
}

function deleterow(event) {
    var tr = $(event).closest('tr');
    tr.css("background-color", "#FF3700");
    tr.fadeOut(400, function () {
        tr.remove();
    });
    return false;
}
var clean_text = function (text) {
    text = text.replace(/"/g, '""');
    text = text.replace(/,/g, " ");
    return text;
};



function table_to_array(table) {
    var rows = [];
    var title = [];
    var tablerows = $(table).find('tr');
    var tableheader = $("#headerrow").children();
    var headers_num = 0;
    for (var i = 1; i < tableheader.length; ++i) {
        var text = clean_text($(tableheader[i]).text());
        if (text != '') {
            headers_num += 1;
            title.push(text);
        } else
            break;
    }
    alertify.log("Note that rows with no address or title will be ignored.");
    for (var i = 1; i < tablerows.length; ++i) {
        var data = [];

        // $(this).find('th').each(function () {
        //   var text = clean_text($(this).text());
        //   if (text.length > 0)
        //     headers_num += 1;
        //   title.push(text);
        // });
        var rowcells = $(tablerows[i]).find('td');
        if (($(rowcells[1]).text().replace(/ /g,'') == "") || ($(rowcells[2]).text().replace(/ /g,'') == "")) {
            continue;
        }
        for (var j = 0; j < headers_num; ++j) {
            var text = clean_text($(rowcells[j + 1]).text());
            data.push(text);
        }

        // data = data.join(",");
        rows.push(data);
    }
    ;
    // title = title.join(",");
    // rows = rows.join("\n");
    // console.log(rows);
    return {"header": title, "rows": rows};
}