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

// Build the country menu...

function buildCountryMenu() {

    let menuContainer = $("#dropdownMenu");
    let countryId = 0;
    let html = "";

    COUNTRY_DATA.forEach(function (country) {

        html += "<li><a class='country_selector";

        if (countryId === dataStore.selectedCountry) html += " navbar_selected";

        html += "' data-id='" + countryId + "' href='#'>";
        html += country.name;
        html += "</a></li>";

        ++countryId;
    });

    menuContainer.append(html);

    $(".country_selector").click( function() {

        $(".country_selector").removeClass("navbar_selected");
        $(this).addClass("navbar_selected");

        switchCountry($(this).data("id"));
    });
}

// Build region checkboxes for the selected country...

function initialiseRegionCheckboxes(countryInfo) {

    let checkboxContainer = $("#reg_checkbox_container");
    checkboxContainer.empty();   // Remove existing checkboxes...

    let firstTime = true;
    let html = "";

    countryInfo.regions.forEach(function (regionData) {

        html += "<span><label class='control_label'>" + regionData.displayName + " </label>"
             +
             "<input type='checkbox' class='region_checkbox' data-name='" + regionData.displayName + "'";

        if (firstTime) {
            html += " checked></span>"
            firstTime = false;
        } else
            html += "></span>";
    });

    checkboxContainer.append(html);

    $(".region_checkbox").click( function() { rebuildRegionsChart(); });
}

// Update the date pickers with values from the data store...

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

// Get a date string for use on the charts...

function getChartDateString(d) {

    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + String(d.getFullYear()).substring(2, 4);
}

// Get a date string for use elsewhere...

function getDateTimeString(d) {

    return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear()
           + " " +
           d.toTimeString().split(" ")[0];
}

// Get date from the apify raw data block...

function getDate(rawBlock) {

    let date = rawBlock["lastUpdatedAtApify"];
    if (!date) return null;

    let datePart = date.substring(0, 10);
    datePart = datePart.replace(new RegExp("-", "g"), "/");

    return new Date(datePart);
}

// Build the data store: date range and populate...

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

// Rebuild the country chart...

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

// Rebuild the regions chart...

function rebuildRegionsChart() {

    let startDate = $("#reg_date_from").datepicker("getDate");
    let endDate = $("#reg_date_to").datepicker("getDate");

    let regionArray = [];

    $(".region_checkbox").each(function () {

        if ($(this).is(":checked")) {
            let regionName = $(this).data("name");
            regionArray.push(generateRegionAndColour(regionName, COUNTRY_DATA[dataStore.selectedCountry]));
        }
    });

    let dataSets = generateRegionDataSets(dataStore, startDate, endDate, regionArray);

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

// Reflect state: loading...

function startLoading() {

    $("#status_panel_text").text("Retrieving data");
    $("#loader_1").css("visibility", "visible");
    $("#refresh_button").css("pointer-events", "none");
    $(".country_selector").css("pointer-events", "none");
}

// Reflect state: loading completed...

function stopLoading(msg) {

    $("#status_panel_text").text(msg);
    $("#loader_1").css("visibility", "hidden");
    $("#refresh_button").css("pointer-events", "auto");
    $(".country_selector").css("pointer-events", "auto");
}

// Handle country change...

function switchCountry(countryId) {

    dataStore.selectedCountry = countryId;

    let countryData = COUNTRY_DATA[dataStore.selectedCountry];

    $(".feature_section_country").text(countryData.name + ":");
    initialiseRegionCheckboxes(countryData);
    retrieveAndProcessData();
}

// Entry point...

function initialise() {

    buildCountryMenu();
    switchCountry(dataStore.selectedCountry);
}

// Get data from API and populate charts...

function retrieveAndProcessData() {

    dataStore.cleanCountryDataInfected = [];
    dataStore.cleanRegDataInfected = [];

    let selectedCountryBlock = COUNTRY_DATA[dataStore.selectedCountry];

    startLoading();
    updateDatePickers();

    rebuildCountryChart();
    rebuildRegionsChart();

    $.getJSON(selectedCountryBlock.dataSource, function (rawData) {

        stopLoading("Last updated " + getDateTimeString(new Date(Date.now())));
        buildDataStore(rawData, selectedCountryBlock);

        updateDatePickers();

        rebuildCountryChart();
        rebuildRegionsChart();
    })
    .fail(function () { stopLoading("Failed to retrieve " + selectedCountryBlock.name + " data from API"); })
}