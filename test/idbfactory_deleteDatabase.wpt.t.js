require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbfactory_deleteDatabase')
    await harness(async () => {
        var open_rq = createdb(async_test(), undefined, 9);

        open_rq.onupgradeneeded = function onupgradeneeded(e) {};
        open_rq.onsuccess = function onsuccess(_e) {
            var db = e.target.result;
            db.close();

            var delete_rq = window.indexedDB.deleteDatabase(db.name);
            delete_rq.onerror = fail(this, "Unexpected delete_rq.error event");
            delete_rq.onsuccess = this.step_func( function  onsuccess(_e) {
                assert_equals(e.target.source, null, "event.target.source")
                this.done();
            });
        }
    })
})
