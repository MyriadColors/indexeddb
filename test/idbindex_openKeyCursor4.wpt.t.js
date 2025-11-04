require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbindex_openKeyCursor4')
    await harness(async () => {
        var db,
            t = async_test();

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var store = db.createObjectStore("store", { keyPath: "key" });
            var index = store.createIndex("index", "indexedProperty");
            store.add({ indexedProperty: "data", key: 1 });

            e.target.transaction.abort();

            assert_throws_dom("InvalidStateError", function onupgradeneeded(){
                index.openKeyCursor();
            });
            t.done();
        }
    })
})
