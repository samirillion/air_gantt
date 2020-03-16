class AirGantt {
    tasks(key) {
        let base = new Airtable({apiKey: key}).base('appq8nALYBhLsFKeZ');

        let fields = []

        return base('Task').select({
            maxRecords: -1,
            view: "Main view"
        }).eachPage(function page(records, fetchNextPage) {

            records.forEach(record => {
                fields.push(record.fields);
            });
    
            fetchNextPage();

        }, function done(err) {
            if (err) { console.error(err); return; }
        });

    }
}

module.exports = AirGantt;
