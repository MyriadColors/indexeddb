require('proof')(3, async okay => {
    await require('./harness')(okay, 'idbcursor_continue_index3')
    await harness(async () => {

        let db,
          t = async_test(),
          records = [ { iKey: "indexKey_0", pKey: "primaryKey_0" },
                      { iKey: "indexKey_1", pKey: "primaryKey_1" } ];

        const open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            const objStore = db.createObjectStore("test", {keyPath:"pKey"});

            objStore.createIndex("index", "iKey");

            for (let i = 0; i < records.length; i++)
                {objStore.add(records[i]);}
        };

        open_rq.onsuccess = function onsuccess(_e) {
            var count = 0;
            var cursor_rq = db.transaction("test")
                              .objectStore("test")
                              .index("index")
                              .openCursor(undefined, "next"); // XXX: Fx has issue with "undefined"

            cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
                var cursor = e.target.result;
                if (!cursor) {
                    assert_equals(count, 2, "ran number of times");
                    t.done();
                    return
                }

                // First time checks key equal, second time checks key less than
                assert_throws_dom("DataError",
                    function onsuccess() { cursor.continue(records[0].iKey); });

                cursor.continue();

                count++;
            });
        };

    })
})
