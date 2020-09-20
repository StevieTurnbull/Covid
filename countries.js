// Master data source for countries and their regions
// - also defines the data source for each country...

const COUNTRY_DATA = [
    {
        name: "United Kingdom",
        dataSource: "https://api.apify.com/v2/datasets/K1mXdufnpvr53AFk6/items?format=json&clean=1",
        countryDataKeys: [ "infected", "totalInfected" ], 
        regions: [
            { displayName: "England", displayColour: "#2f4f4f", dataKeys: [ "england", "englandConfirmed" ] },
            { displayName: "Scotland", displayColour: "#7f0000", dataKeys: [ "scottland", "scottlandConfirmed" ] },
            { displayName: "Wales", displayColour: "#000080", dataKeys: [ "wales", "walesConfirmed" ] },
            { displayName: "N. Ireland", displayColour: "#228b22", dataKeys: [ "ireland", "northernIrelandConfirmed" ] }
        ]
    },
    {
        name: "Netherlands",
        dataSource: "https://api.apify.com/v2/datasets/jr5ogVGnyfMZJwpnB/items?format=json&clean=1",
        countryDataKeys: [ "infected" ],
        regions: [
            { displayName: "South Holland", displayColour: "#2f4f4f", dataKeys: [ "Zuid-Holland" ] },
            { displayName: "North Holland", displayColour: "#a52a2a", dataKeys: [ "Noord-Holland" ] },
            { displayName: "North Brabant", displayColour: "#006400", dataKeys: [ "Noord-Brabant" ] },
            { displayName: "Gelderland", displayColour: "#00008b", dataKeys: [ "Gelderland" ] },
            { displayName: "Limburg", displayColour: "#ff0000", dataKeys: [ "Limburg" ] },
            { displayName: "Utrecht", displayColour: "#ffa500", dataKeys: [ "Utrecht" ] },
            { displayName: "Overijssel", displayColour: "#ffff00", dataKeys: [ "Overijssel" ] },
            { displayName: "Flevoland", displayColour: "#c71585", dataKeys: [ "Flevoland" ] },
            { displayName: "Zeeland", displayColour: "#00ff00", dataKeys: [ "Zeeland" ] },
            { displayName: "Friesland", displayColour: "#00fa9a", dataKeys: [ "Friesland" ] },
            { displayName: "Drenthe", displayColour: "#00ffff", dataKeys: [ "Drenthe" ] },
            { displayName: "Groningen", displayColour: "#0000ff", dataKeys: [ "Groningen" ] },

            { displayName: "Aruba", displayColour: "#ff00ff", dataKeys: [ "Aruba" ] },
            { displayName: "Saint Martin", displayColour: "#f0e68c", dataKeys: [ "Sint Maarten" ] },
            { displayName: "Curacao", displayColour: "#6495ed", dataKeys: [ "Curacao" ] },
            { displayName: "Bonaire, Sint Eustatius and Saba", displayColour: "#ffc0cb", dataKeys: [ "Bonaire, Sint Eustatius and Saba" ] },
            { displayName: "Unknown", displayColour: "#000000", dataKeys: [ "Unknown" ] }
        ]
    }
];