require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbcursor_continue_objectstore3')
    await harness(async () => {
        let db,
          t = async_test(),
          records = [ { pKey: "primaryKey_0" },
                      { pKey: "primaryKey_1" } ];

        const open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            const objStore = db.createObjectStore("test", {keyPath:"pKey"});

            for (let i = 0; i < records.length; i++)
                {objStore.add(records[i]);}
        };

        open_rq.onsuccess = function onsuccess(_e) {
            const cursor_rq = db.transaction("test")
                              .objectStore("test")
                              .openCursor(undefined, "next");

            cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
                const cursor = e.target.result;

                assert_true(cursor instanceof IDBCursor, "cursor exist");
                assert_throws_dom("DataError",
                    function onsuccess() { cursor.continue(records[0].pKey); });

                t.done();
            });
        };
    })
})
