require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbobjectstore_createIndex12')
    await harness(async () => {
        var db,
            ostore,
            t = async_test();

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function  onupgradeneeded(event) {
            db = event.target.result;
            ostore = db.createObjectStore("store");
            db.deleteObjectStore("store");
        }

        open_rq.onsuccess = function  onsuccess(event) {
            t.step(function onsuccess(){
                assert_throws_dom("InvalidStateError", function onsuccess(){
                    ostore.createIndex("index", "indexedProperty");
                });
            });
            t.done();
        }
    })
})
