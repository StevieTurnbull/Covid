// Main processed data store...
// Ideally this would be replaced by a SQL database of some kind.

let dataStore = {

    startDate: new Date("January 1, 2020 00:00:00"),
    endDate: new Date(),
    cleanUKDataInfected: [],
    cleanRegDataInfected: []
}

function DEBUG_DATASTORE() {

    console.log("DATE RANGE START DATE: " + dataStore.startDate.toString() + " END DATE: " + dataStore.endDate.toString());
    console.log("UK entries: " + dataStore.cleanUKDataInfected.length + " Regional entries: " + dataStore.cleanRegDataInfected.length);

    // let text = JSON.stringify(dataStore, null, 2);
    // let uriContent = "data:text/json;charset=utf-8," + encodeURIComponent(text);
    
    // let wnd = window.open("about:blank", "", "_blank");
    // wnd.document.write(text);
}

// Functions...

function updateDatePickers() {

    let endDatePlus1Day = new Date();
    endDatePlus1Day.setDate(dataStore.endDate.getDate() + 1);

    // Update the date pickers with the date range...
    $("#tm_date_from").datepicker('setStartDate', dataStore.startDate);
    $("#tm_date_from").datepicker('setEndDate', dataStore.endDate);
    $("#tm_date_from").datepicker('update', dataStore.startDate);

    $("#tm_date_to").datepicker('setStartDate', dataStore.startDate);
    $("#tm_date_to").datepicker('setEndDate', endDatePlus1Day);
    $("#tm_date_to").datepicker('update', dataStore.endDate);

    $("#reg_date_from").datepicker('setStartDate', dataStore.startDate);
    $("#reg_date_from").datepicker('setEndDate', dataStore.endDate);
    $("#reg_date_from").datepicker('update', dataStore.startDate);

    $("#reg_date_to").datepicker('setStartDate', dataStore.startDate);
    $("#reg_date_to").datepicker('setEndDate', endDatePlus1Day);
    $("#reg_date_to").datepicker('update', dataStore.endDate);
}

function getChartDateString(d) {

    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + String(d.getFullYear()).substring(2, 4);
}

function getRegDataBlock(rawBlock) {

    let eng = rawBlock["england"];
    if (!eng) {
        eng = rawBlock["englandConfirmed"];
    }

    let sco = rawBlock["scottland"];
    if (!sco) {
        sco = rawBlock["scottlandConfirmed"];
    }

    let wal = rawBlock["wales"];
    if (!wal) {
        wal = rawBlock["walesConfirmed"];
    }

    let nir = rawBlock["ireland"];
    if (!nir) {
        nir = rawBlock["northernIrelandConfirmed"];
    }

    if (!eng || !sco || !wal || !nir) return null;

    return { england: eng,
             scotland: sco,
             wales: wal,
             nireland: nir };
}

function getUKDataBlock(rawBlock) {

    let uk = rawBlock["infected"];
    if (!uk) {
        uk = rawBlock["totalInfected"];
    }

    if (!uk) {
        let reg = getRegDataBlock(rawBlock);
        if (reg) {
            return { unitedKingdom: reg.england + reg.scotland + reg.wales + reg.nireland }
        }

        return null;
    }

    return { date: null,
             unitedKingdom: uk };
}

function getDate(rawBlock) {

    let date = rawBlock["lastUpdatedAtApify"];
    if (!date) return null;

    let datePart = date.substring(0, 10);
    datePart = datePart.replace(new RegExp("-", "g"), "/");

    return new Date(datePart);
}

function buildDataStore(rawData) {

    let startDate = new Date();
    let endDate = new Date();
    let firstTime = true;

    rawData.forEach(function (rawBlock) {

        let date = getDate(rawBlock);
        if (!date) return;

        if (firstTime) {
            startDate = date;
            endDate = date;
            firstTime = false;
        } else {
            if (date < startDate) {
                startDate = date;
            }

            if (date > endDate) {
                endDate = date;
            }
        }

        let ukData = getUKDataBlock(rawBlock);
        if (ukData) {
            ukData.date = date;

            // Make sure we only have the most recent data for a particular day...
            let len = dataStore.cleanUKDataInfected.length;
            if (len > 0 && dataStore.cleanUKDataInfected[len - 1].date.getTime() == date.getTime()) {
                dataStore.cleanUKDataInfected.pop();
            }

            dataStore.cleanUKDataInfected.push(ukData);
        }

        let regData = getRegDataBlock(rawBlock);
        if (regData) {
            regData.date = date;

            // Make sure we only have the most recent data for a particular day...
            let len = dataStore.cleanRegDataInfected.length;
            if (len > 0 && dataStore.cleanRegDataInfected[len - 1].date.getTime() == date.getTime()) {
                dataStore.cleanRegDataInfected.pop();
            }

            dataStore.cleanRegDataInfected.push(regData);
        }

        // This is a workaround to ensure display of regional data
        // as there are only a few good data points from the chosen provider.
        // So we produce a VERY rough estimate based on UK population...
        // Source: https://en.wikipedia.org/wiki/Countries_of_the_United_Kingdom_by_population
        if (ukData && !regData) {
            let ukValue = ukData.unitedKingdom;
            let block = { date: date,
                          england: ukValue * (84.3 / 100.0),        // 84.3% of UK population
                          scotland: ukValue * (8.2 / 100.0),        // 8.2%
                          wales: ukValue * (4.7 / 100.0),           // 4.7%
                          nireland: ukValue * (2.8 / 100.0) };      // 2.8%

            // Make sure we only have the most recent data for a particular day...
            let len = dataStore.cleanRegDataInfected.length;
            if (len > 0 && dataStore.cleanRegDataInfected[len - 1].date.getTime() == date.getTime()) {
                dataStore.cleanRegDataInfected.pop();
            }

            dataStore.cleanRegDataInfected.push(block);
        }
    });

    if (firstTime) return;

    dataStore.startDate = startDate;
    dataStore.endDate = endDate;
}

function generateUKDataSet(startDate, endDate) {

    // If we've got no actual data just return filler...
    if (dataStore.cleanUKDataInfected.length === 0) {
        return {
            xAxisData: [ getChartDateString(startDate), getChartDateString(endDate) ],
            yAxisData: [ 0, 0 ]
        }
    }

    let axesData = {
        xAxisData: [],
        yAxisData: []
    }

    dataStore.cleanUKDataInfected.forEach(function (block) {

        if (block.date.getTime() < startDate.getTime()) return;
        if (block.date.getTime() > endDate.getTime()) return;

        axesData.xAxisData.push(getChartDateString(block.date));
        axesData.yAxisData.push(block.unitedKingdom);
    });

    return axesData;
}

function rebuildUKChart() {

    let startDate = $("#tm_date_from").datepicker("getDate");
    let endDate = $("#tm_date_to").datepicker("getDate");

    let dataSet = generateUKDataSet(startDate, endDate);

    let ctx = $("#tm_chart")[0].getContext("2d");

    let myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dataSet.xAxisData,
            datasets: [{ data: dataSet.yAxisData, borderColor: ["black"] }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false
            }
        }
    });
}

function generateRegDataSets(startDate, endDate, regions) {

    // If we've got no actual data just return filler...
    if (dataStore.cleanUKDataInfected.length === 0) {
        return {
            xAxisData: [ getChartDateString(startDate), getChartDateString(endDate) ],
            displayLegend: false,
            data: [ { label: "None", data: [ 0, 0 ], borderColor: ["black"] } ]
        }
    }

    let axesData = {
        xAxisData: [],
        displayLegend: true,
        data: []
    }

    let streams = [ { label: "England", data: [], borderColor: "blue" },
                    { label: "Wales", data: [], borderColor: "darkRed" },
                    { label: "Scotland", data: [], borderColor: "orange" },
                    { label: "N. Ireland", data: [], borderColor: "green" } ];

    dataStore.cleanRegDataInfected.forEach(function (block) {

        if (block.date.getTime() < startDate.getTime()) return;
        if (block.date.getTime() > endDate.getTime()) return;

        axesData.xAxisData.push(getChartDateString(block.date));

        if (regions.england) streams[0].data.push(block.england);
        if (regions.wales) streams[1].data.push(block.wales);
        if (regions.scotland) streams[2].data.push(block.scotland);
        if (regions.nireland) streams[3].data.push(block.nireland);
    });

    streams.forEach(function(s) {

        if (s.data.length === 0) return;

        axesData.data.push(s);
    });

    return axesData;
}

function rebuildRegChart() {

    let startDate = $("#reg_date_from").datepicker("getDate");
    let endDate = $("#reg_date_to").datepicker("getDate");

    let regions = {
        england: $("#england_checkbox").is(":checked"),
        wales: $("#wales_checkbox").is(":checked"),
        scotland: $("#scotland_checkbox").is(":checked"),
        nireland: $("#nireland_checkbox").is(":checked")
    }

    let dataSets = generateRegDataSets(startDate, endDate, regions);

    let ctx = $("#reg_chart")[0].getContext("2d");

    let myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dataSets.xAxisData,
            datasets: dataSets.data
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: dataSets.displayLegend
            }
        }
    });
}

function retrieveAndProcessData() {

    updateDatePickers();

    rebuildUKChart();
    rebuildRegChart();

    let src = "https://api.apify.com/v2/datasets/K1mXdufnpvr53AFk6/items?format=json&clean=1";

    $.getJSON(src, function (rawData) {

        buildDataStore(rawData);

        updateDatePickers();

        rebuildUKChart();
        rebuildRegChart();
    })
    .fail(function () { alert("Failed to retrieve data from API"); })
    .always(function () { $("#loading_panel").css("visibility", "hidden"); });
}