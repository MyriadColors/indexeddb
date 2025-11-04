require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbindex_count4')
    await harness(async () => {
        var db, t = async_test();

        var open_rq = createdb(t);

        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { autoIncrement: true });
            store.createIndex("index", "indexedProperty");

            for(let i = 0; i < 10; i++) {
                store.add({ indexedProperty: "data" + i });
            }
        }

        open_rq.onsuccess = function onsuccess(_e) {
            var index = db.transaction("store")
                          .objectStore("store")
                          .index("index");

            assert_throws_dom("DataError", function onsuccess() {
                index.count(NaN);
            });

            t.done();
        }
    })
})
