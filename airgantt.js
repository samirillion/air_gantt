var Airtable = require('airtable');

class AirGantt {
    constructor(key) {
        this.base = new Airtable({apiKey: key}).base('appq8nALYBhLsFKeZ');
    }
    tasks() {
        this.base('Task').select({
            maxRecords: -1,
            view: "Main view"
        }).eachPage(function page(records, fetchNextPage) {

            let fields = []
            records.forEach(function(record) {
                fields.push(record.fields);
            });

            return fields;
    
            fetchNextPage();

        }, function done(err) {
            if (err) { console.error(err); return; }
        });
    }
}

module.exports = AirGantt;
