require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbcursor_update_objectstore3')
    await harness(async () => {

        var db,
          t = async_test(),
          records = [ { iKey: "indexKey_0", pKey: "primaryKey_0" },
                      { iKey: "indexKey_1", pKey: "primaryKey_1" } ];

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test", { keyPath: "pKey" });

            for (let i = 0; i < records.length; i++)
                {objStore.add(records[i]);}

            var cursor_rq = objStore.openCursor();

            cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
                var cursor = e.target.result;
                assert_true(cursor instanceof IDBCursor, "cursor exist");
                window.cursor = cursor;
                window.record = cursor.value;
            });

            e.target.transaction.oncomplete = t.step_func(function oncomplete(e) {
                assert_throws_dom('TransactionInactiveError', function oncomplete() { window.cursor.update(window.record); })
                t.done();
            });
        }

    })
})
