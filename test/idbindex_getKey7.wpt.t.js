require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbindex_getKey7')
    await harness(async () => {
        var db,
            t = async_test();

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");
            store.add({ indexedProperty: "data", key: 1 });
        }
        open_rq.onsuccess = function onsuccess(_e) {
            db = e.target.result;
            var tx = db.transaction('store');
            var index = tx.objectStore('store').index('index');
            tx.abort();

            assert_throws_dom("TransactionInactiveError", function onsuccess(){
                index.getKey("data");
            });
            t.done();
        }
    })
})
