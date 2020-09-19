// Main processed data store...
// TODO: 1) Stringify JSON data and add to local storage
//          (window.localStorage...) following successful retrieval
//       2) De-stringify JSON data and rebuild data store when page
//          loads for the first time
//       3) Add 'last updated' attribute to data store

let dataStore = {

    startDate: new Date("January 1, 2020 00:00:00"),
    endDate: new Date(),
    cleanCountryDataInfected: [],
    cleanRegDataInfected: [],
    selectedCountry: 0
}

let tmChart = null;
let regChart = null;

// Functions...

function initialiseRegionCheckboxes(countryInfo) {

    let checkboxContainer = $("#reg_checkbox_container");

    // checkboxContainer.empty();   // Remove existing checkboxes...

    // TODO: Make #reg_checkbox_container a table
    //       Add tr's, each containing 3 td's - each td contains the label and checkbox...

    // let firstTime = true;

    // countryBlock.regions.forEach(function (regionData) {

    //     checkboxContainer.append("<label class='control-label'>" + regionData.displayName + " </label>");

    //     let cbString = "<input type='checkbox' class='form-check-input'";
    //     if (firstTime) {
    //         cbString += " checked>"
    //         firstTime = false;
    //     } else {
    //         cbString += ">";
    //     }

    //     checkboxContainer.append(cbString);
    // });
}

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

function getDateTimeString(d) {

    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
           + " " +
           d.toTimeString().split(" ")[0];
}

function getDate(rawBlock) {

    let date = rawBlock["lastUpdatedAtApify"];
    if (!date) return null;

    let datePart = date.substring(0, 10);
    datePart = datePart.replace(new RegExp("-", "g"), "/");

    return new Date(datePart);
}

function buildDataStore(rawData, countryInfo) {

    let startDate = new Date();
    let endDate = new Date();
    let firstTime = true;

    rawData.forEach(function (rawBlock) {

        let date = getDate(rawBlock);
        if (!date) return;

        // Build our range of dates...
        if (firstTime) {
            startDate = date;
            endDate = date;
            firstTime = false;
        } else {
            if (date < startDate) startDate = date;
            if (date > endDate) endDate = date;
        }

        addCountryAndRegionalData(dataStore, date, rawBlock, countryInfo);
    });

    // If no data, leave start / end dates as before...
    if (firstTime) return;

    dataStore.startDate = startDate;
    dataStore.endDate = endDate;
}

function rebuildCountryChart() {

    let startDate = $("#tm_date_from").datepicker("getDate");
    let endDate = $("#tm_date_to").datepicker("getDate");

    let dataSet = generateCountryDataSet(dataStore, startDate, endDate);

    let ctx = $("#tm_chart")[0].getContext("2d");

    if (tmChart) tmChart.destroy();

    tmChart = new Chart(ctx, {
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

function rebuildRegionsChart() {

    let startDate = $("#reg_date_from").datepicker("getDate");
    let endDate = $("#reg_date_to").datepicker("getDate");

    let regions = {
        england: $("#england_checkbox").is(":checked"),
        wales: $("#wales_checkbox").is(":checked"),
        scotland: $("#scotland_checkbox").is(":checked"),
        nireland: $("#nireland_checkbox").is(":checked")
    }

    let dataSets = generateRegionDataSets(dataStore, startDate, endDate, regions);

    let ctx = $("#reg_chart")[0].getContext("2d");

    if (regChart) regChart.destroy();

    regChart = new Chart(ctx, {
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

function startLoading(countryName) {

    $("#status_panel_text").text("Retrieving " + countryName + " data");
    $("#loader_1").css("visibility", "visible");
    $("#refresh_button").css("pointer-events", "none");
}

function stopLoading(msg) {

    $("#status_panel_text").text(msg);
    $("#loader_1").css("visibility", "hidden");
    $("#refresh_button").css("pointer-events", "auto");
}

function retrieveAndProcessData() {

    dataStore.cleanCountryDataInfected = [];
    dataStore.cleanRegDataInfected = [];

    let selectedCountryBlock = COUNTRY_DATA[dataStore.selectedCountry];

    initialiseRegionCheckboxes(selectedCountryBlock);

    startLoading(selectedCountryBlock.name);
    updateDatePickers();

    rebuildCountryChart();
    rebuildRegionsChart();

    $.getJSON(selectedCountryBlock.dataSource, function (rawData) {

        stopLoading(selectedCountryBlock.name + ": last updated " + getDateTimeString(new Date(Date.now())));
        buildDataStore(rawData, selectedCountryBlock);

        updateDatePickers();

        rebuildCountryChart();
        rebuildRegionsChart();
    })
    .fail(function () { stopLoading("Failed to retrieve " + selectedCountryBlock.name + " data from API"); })
}