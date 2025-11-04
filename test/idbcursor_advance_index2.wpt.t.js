require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbcursor_advance_index2')
    await harness(async () => {

        let db,
          test = async_test(),
          records = [ { iKey: "indexKey_0", pKey: "primaryKey_0" },
                      { iKey: "indexKey_1", pKey: "primaryKey_1" } ];

        const open_rq = createdb(test);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var objStore = db.createObjectStore("test", {keyPath:"pKey"});

            objStore.createIndex("index", "iKey");

            for(let i = 0; i < records.length; i++)
                {objStore.add(records[i]);}
        };

        open_rq.onsuccess = function onsuccess(e) {
            var cursor_rq = db.transaction("test")
                              .objectStore("test")
                              .index("index")
                              .openCursor();

            cursor_rq.onsuccess = test.step_func(function onsuccess(e) {
                var cursor = e.target.result;

                assert_true(cursor != null, "cursor exist");
                assert_throws_js(TypeError,
                    function onsuccess() { cursor.advance(document); });

                test.done();
            });
        };

    })
})
