require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbcursor_advance_objectstore3')
    await harness(async () => {
        var db,
            t = async_test(),
            records = [{ pKey: "primaryKey_0"},
                       { pKey: "primaryKey_1"}];

        const open_rq = createdb(t);
        open_rq.onupgradeneeded = function  onupgradeneeded(event) {
            db = event.target.result;
            const objStore = db.createObjectStore("store", {keyPath:"pKey"});
            for (let i = 0; i < records.length; i++) {
                objStore.add(records[i]);
            }
        }

        open_rq.onsuccess = function  onsuccess(_event) {
            const txn = db.transaction("store", "readwrite");
            const rq = txn.objectStore("store").openCursor();
            rq.onsuccess = t.step_func(function onsuccess(event) {
                const cursor = event.target.result;
                assert_true(cursor instanceof IDBCursor);

                event.target.transaction.abort();
                assert_throws_dom("TransactionInactiveError", function onsuccess() {
                    cursor.advance(1);
                }, "Calling advance() should throws an exception TransactionInactiveError when the transaction is not active");

                t.done();
            });
        }

    })
})
