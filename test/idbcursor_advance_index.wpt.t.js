require('proof')(4, async okay => {
    await require('./harness')(okay, 'idbcursor_advance_index')
    await harness(async () => {
        var db,
          count = 0,
          t = async_test(),
          records = [ { iKey: "indexKey_0", pKey: "primaryKey_0" },
                      { iKey: "indexKey_1", pKey: "primaryKey_1" },
                      { iKey: "indexKey_2", pKey: "primaryKey_2" },
                      { iKey: "indexKey_3", pKey: "primaryKey_3" }];

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var store = db.createObjectStore("test", {keyPath:"pKey"});
            store.createIndex("idx", "iKey");

            for(let i = 0; i < records.length; i++) {
                store.add(records[i]);
            }
        };

        open_rq.onsuccess = function  onsuccess(_e) {
            var cursor_rq = db.transaction("test")
                              .objectStore("test")
                              .index("idx")
                              .openCursor();

            cursor_rq.onsuccess = t.step_func(function onsuccess(e) {
                var cursor = e.target.result;
                assert_true(cursor instanceof IDBCursor);

                switch(count) {
                    case 0: {
                        count += 3;
                        cursor.advance(3);
                        break;
                    }
                    case 3: {
                        const record = cursor.value;
                        assert_equals(record.pKey, records[count].pKey, "record.pKey");
                        assert_equals(record.iKey, records[count].iKey, "record.iKey");
                        t.done();
                        break;
                    }
                    default: {
                        assert_unreached("unexpected count");
                        break;
                    }
                }
            });
        }
    })
})
