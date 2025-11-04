require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbindex_getKey')
    await harness(async () => {
        var db,
          t = async_test(),
          record = { indexedProperty:"data", key:1 };

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test", { keyPath: "key" });
            objStore.createIndex("index", "indexedProperty");

            objStore.add(record);
        };

        open_rq.onsuccess = function onsuccess(_e) {
            var rq = db.transaction("test")
                       .objectStore("test");

            rq = rq.index("index");

            rq = rq.getKey("data");

            rq.onsuccess = t.step_func(function onsuccess(_e) {
                assert_equals(e.target.result, record.key);
                t.done();
            });
        };
    })
})
