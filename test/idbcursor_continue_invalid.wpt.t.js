require('proof')(5, async okay => {
    await require('./harness')(okay, 'idbcursor_continue_invalid')
    await harness(async () => {

        let db,
          t = async_test();

        const open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            const objStore = db.createObjectStore("test");

            objStore.createIndex("index", "");

            objStore.add("data",  1);
            objStore.add("data2", 2);
        };

        open_rq.onsuccess = function onsuccess(_e) {
            let count = 0;
            const cursor_rq = db.transaction("test")
                              .objectStore("test")
                              .index("index")
                              .openCursor();

            cursor_rq.onsuccess = t.step_func(function onsuccess(e) {
                if (!e.target.result) {
                    assert_equals(count, 2, 'count');
                    t.done();
                    return;
                }
                const cursor = e.target.result;

                cursor.continue();

                // Second try
                assert_throws_dom('InvalidStateError',
                    function onsuccess() { cursor.continue(); }, 'second continue');

                assert_throws_dom('InvalidStateError',
                    function onsuccess() { cursor.continue(3); }, 'third continue');

                count++;
            });
        };

    })
})
