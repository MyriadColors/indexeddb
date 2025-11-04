require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbobjectstore_createIndex5-emptykeypath')
    await harness(async () => {
        var db, aborted,
          t = async_test()

        var open_rq = createdb(t);
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result;
            var txn = e.target.transaction,
              objStore = db.createObjectStore("store");

            for (let i = 0; i < 5; i++)
                {objStore.add("object_" + i, i);}

            var rq = objStore.createIndex("index", "")
            rq.onerror = function onerror() { assert_unreached("error: " + rq.error.name); }
            rq.onsuccess = function onsuccess() {}

            objStore.index("index")
                    .get('object_4')
                    .onsuccess = t.step_func(function onsuccess(_e) {
                assert_equals(e.target.result, 'object_4', 'result');
            });
        }

        open_rq.onsuccess = function onsuccess() {
            t.done();
        }
    })
})
