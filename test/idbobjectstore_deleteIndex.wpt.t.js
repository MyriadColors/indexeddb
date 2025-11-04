require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbobjectstore_deleteIndex')
    await harness(async () => {
        var db,
          t = async_test(),
          key = 1,
          record = { property: "data" };

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            db.createObjectStore("test")
              .createIndex("index", "indexedProperty")
        };

        open_rq.onsuccess = function onsuccess(_e) {
            db.close();
            var new_version = createdb(t, db.name, 2);
            new_version.onupgradeneeded = function onupgradeneeded(e) {
                db = e.target.result;
                var objStore = e.target.transaction.objectStore("test")
                objStore.deleteIndex("index");
            }
            new_version.onsuccess = function onsuccess(_e) {
                var index,
                  objStore = db.transaction("test")
                               .objectStore("test");

                assert_throws_dom('NotFoundError',
                    function onsuccess() { index = objStore.index("index") });
                assert_equals(index);
                db.close();
                t.done();
            }
        }
    })
})
