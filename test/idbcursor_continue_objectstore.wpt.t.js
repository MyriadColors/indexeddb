require('proof')(5, async okay => {
    await require('./harness')(okay, 'idbcursor_continue_objectstore')
    await harness(async () => {
        let db,
          count = 0,
          t = async_test(),
          records = [ { pKey: "primaryKey_0" },
                      { pKey: "primaryKey_1" } ];

        const open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            const objStore = db.createObjectStore("test", {autoIncrement:true, keyPath:"pKey"});

            for (let i = 0; i < records.length; i++)
                {objStore.add(records[i]);}
        };

        open_rq.onsuccess = function onsuccess(_e) {
            const store = db.transaction("test")
                          .objectStore("test");

            const cursor_rq = store.openCursor();
            cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
                const cursor = e.target.result;
                if (!cursor) {
                    assert_equals(count, records.length, "cursor run count");
                    t.done();
                    return
                }

                const record = cursor.value;
                assert_equals(record.pKey, records[count].pKey, "primary key");
                assert_equals(record.iKey, records[count].iKey, "index key");

                cursor.continue();
                count++;
            });
        };
    })
})
