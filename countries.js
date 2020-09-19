// Master data source for countries and their regions
// - also defines the data source for each country...

const COUNTRY_DATA = [
    {
        name: "United Kingdom",
        dataSource: "https://api.apify.com/v2/datasets/K1mXdufnpvr53AFk6/items?format=json&clean=1",
        countryDataKeys: [ "infected", "totalInfected" ], 
        regions: [
            { displayName: "England", dataKeys: [ "england", "englandConfirmed" ] },
            { displayName: "Scotland", dataKeys: [ "scottland", "scottlandConfirmed" ] },
            { displayName: "Wales", dataKeys: [ "wales", "walesConfirmed" ] },
            { displayName: "N. Ireland", dataKeys: [ "ireland", "northernIrelandConfirmed" ] }
        ]
    },
    {
        name: "Netherlands",
        dataSource: "https://api.apify.com/v2/datasets/jr5ogVGnyfMZJwpnB/items?format=json&clean=1",
        countryDataKeys: [ "infected" ],
        regions: [
            { displayName: "South Holland", dataKeys: [ "Zuid-Holland" ] },
            { displayName: "North Holland", dataKeys: [ "Noord-Holland" ] },
            { displayName: "North Brabant", dataKeys: [ "Noord-Brabant" ] },
            { displayName: "Gelderland", dataKeys: [ "Gelderland" ] },
            { displayName: "Limburg", dataKeys: [ "Limburg" ] },
            { displayName: "Utrecht", dataKeys: [ "Utrecht" ] },
            { displayName: "Overijssel", dataKeys: [ "Overijssel" ] },
            { displayName: "Flevoland", dataKeys: [ "Flevoland" ] },
            { displayName: "Zeeland", dataKeys: [ "Zeeland" ] },
            { displayName: "Friesland", dataKeys: [ "Friesland" ] },
            { displayName: "Drenthe", dataKeys: [ "Drenthe" ] },
            { displayName: "Groningen", dataKeys: [ "Groningen" ] },

            { displayName: "Aruba", dataKeys: [ "Aruba" ] },
            { displayName: "Saint Martin", dataKeys: [ "Sint Maarten" ] },
            { displayName: "Curacao", dataKeys: [ "Curacao" ] },
            { displayName: "Bonaire, Sint Eustatius and Saba", dataKeys: [ "Bonaire, Sint Eustatius and Saba" ] },
            { displayName: "Unknown", dataKeys: [ "Unknown" ] }
        ]
    }
];

// Functions...

// Process the regional data from the raw data block...

function getRegionsDataBlock(rawBlock, countryInfo) {

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

// Process the country data from the raw data block...

function getCountryDataBlock(rawBlock, countryInfo) {

    let totalInfected = null;

    for (let i = 0; i < countryInfo.countryDataKeys.length; ++i) {
        totalInfected = rawBlock[countryInfo.countryDataKeys[i]];
        if (totalInfected) break;
    }

    if (!totalInfected) {
        // Try to get the whole country value from the summed regional values...
        let reg = getRegionsDataBlock(rawBlock, countryInfo);
        if (reg) {
            return { totalInfected: reg.england + reg.scotland + reg.wales + reg.nireland }
        }

        return null;
    }

    return { date: null,
             totalInfected: totalInfected };
}

// Add country and regional data into the supplied datastore,
// adapting based on the country info provided...

function addCountryAndRegionalData(ds, blockDate, rawBlock, countryInfo) {

    // Get country-wide data...
    let countryData = getCountryDataBlock(rawBlock, countryInfo);
    if (countryData) {
        countryData.date = blockDate;

        // Make sure we only have the most recent data for a particular day...
        let len = ds.cleanCountryDataInfected.length;
        if (len > 0 && ds.cleanCountryDataInfected[len - 1].date.getTime() == blockDate.getTime()) {
            ds.cleanCountryDataInfected.pop();
        }

        ds.cleanCountryDataInfected.push(countryData);
    }

    // Get regional data...
    let regData = getRegionsDataBlock(rawBlock, countryInfo);
    if (regData) {
        regData.date = blockDate;

        // Make sure we only have the most recent data for a particular day...
        let len = ds.cleanRegDataInfected.length;
        if (len > 0 && ds.cleanRegDataInfected[len - 1].date.getTime() == blockDate.getTime()) {
            ds.cleanRegDataInfected.pop();
        }

        ds.cleanRegDataInfected.push(regData);
    }

    // This is a workaround to ensure display of regional data
    // as there are only a few good data points from the chosen provider.
    // So we produce a VERY rough estimate based on UK population...
    // Source: https://en.wikipedia.org/wiki/Countries_of_the_United_Kingdom_by_population
    if (countryInfo.name === "United Kingdom" && countryData && !regData) {
        let countryValue = countryData.totalInfected;
        let block = { date: blockDate,
                      england: Math.ceil(countryValue * (84.3 / 100.0)),        // 84.3% of UK population
                      scotland: Math.ceil(countryValue * (8.2 / 100.0)),        // 8.2%
                      wales: Math.ceil(countryValue * (4.7 / 100.0)),           // 4.7%
                      nireland: Math.ceil(countryValue * (2.8 / 100.0)) };      // 2.8%

        // Make sure we only have the most recent data for a particular day...
        let len = ds.cleanRegDataInfected.length;
        if (len > 0 && ds.cleanRegDataInfected[len - 1].date.getTime() == blockDate.getTime()) {
            ds.cleanRegDataInfected.pop();
        }

        ds.cleanRegDataInfected.push(block);
    }
}

// Generate single stream for country-wide data from the supplied datastore...

function generateCountryDataSet(ds, startDate, endDate) {

    // If we've got no actual data just return filler...
    if (ds.cleanCountryDataInfected.length === 0) {
        return {
            xAxisData: [ getChartDateString(startDate), getChartDateString(endDate) ],
            yAxisData: [ 0, 0 ]
        }
    }

    let axesData = {
        xAxisData: [],
        yAxisData: []
    }

    ds.cleanCountryDataInfected.forEach(function (block) {

        if (block.date.getTime() < startDate.getTime()) return;
        if (block.date.getTime() > endDate.getTime()) return;

        axesData.xAxisData.push(getChartDateString(block.date));
        axesData.yAxisData.push(block.totalInfected);
    });

    return axesData;
}

// Generate multiple streams for country-wide data from the supplied datastore...

function generateRegionDataSets(ds, startDate, endDate, regions) {

    // If we've got no actual data just return filler...
    if (ds.cleanRegDataInfected.length === 0) {
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

    ds.cleanRegDataInfected.forEach(function (block) {

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