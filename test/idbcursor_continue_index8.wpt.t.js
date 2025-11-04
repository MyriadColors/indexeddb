require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbcursor_continue_index8')
    await harness(async () => {

        let db,
          t = async_test(),
          records = [ { iKey: "indexKey_0", pKey: "primaryKey_0" },
                      { iKey: "indexKey_1", pKey: "primaryKey_1" } ];

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

                db.deleteObjectStore("store");
                assert_throws_dom("InvalidStateError", function onsuccess() {
                    cursor.continue();
                }, "If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError");

                t.done();
            });
        }

    })
})
