require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbcursor_advance_objectstore2')
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

                assert_throws_js(TypeError, function onsuccess() {
                    cursor.advance(0);
                }, "Calling advance() with count argument 0 should throw TypeError.");

                t.done();
            });
        }
    })
})
