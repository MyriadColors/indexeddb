require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbcursor_advance_index7')
    await harness(async () => {
        let db,
            t = async_test(),
            records = [{ iKey: "indexKey_0", pKey: "primaryKey_0" },
                       { iKey: "indexKey_1", pKey: "primaryKey_1" }];

        const open_rq = createdb(t);
        open_rq.onupgradeneeded = function  onupgradeneeded(event) {
            db = event.target.result;
            const objStore = db.createObjectStore("store", {keyPath : "pKey"});
            objStore.createIndex("index", "iKey");
            for (let i = 0; i < records.length; i++) {
                objStore.add(records[i]);
            }
            const rq = objStore.index("index").openCursor();
            rq.onsuccess = t.step_func(function onsuccess(event) {
                const cursor = event.target.result;
                assert_true(cursor instanceof IDBCursor);

                event.target.transaction.abort();
                assert_throws_dom("TransactionInactiveError", function onsuccess() {
                    cursor.advance(1);
                }, "Calling advance() should throws an exception TransactionInactiveError when the transaction is not active.");

                t.done();
            });
        }

    })
})
