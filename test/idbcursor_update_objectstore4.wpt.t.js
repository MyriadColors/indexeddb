require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbcursor_update_objectstore4')
    await harness(async () => {

        var db,
          t = async_test()

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test");

            objStore.add("data", "key");
        };

        open_rq.onsuccess = t.step_func(function onsuccess(_e) {
            var txn = db.transaction("test", "readwrite"),
              cursor_rq = txn.objectStore("test")
                             .openCursor();

            cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
                var cursor = e.target.result;

                cursor.value = "new data!";
                cursor.update(cursor.value).onsuccess = t.step_func(function onsuccess(_e) {
                    assert_equals(e.target.result, "key");
                    t.done();
                });
            });
        });

    })
})
