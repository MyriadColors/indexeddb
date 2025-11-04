require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbobjectstore_get5')
    await harness(async () => {
        var db
        var open_rq = createdb(async_test())

        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result
            var os = db.createObjectStore("store")

            for(let i = 0; i < 10; i++)
                {os.add("data" + i, i)}
        }

        open_rq.onsuccess = function  onsuccess(_e) {
            db.transaction("store")
              .objectStore("store")
              .get( IDBKeyRange.bound(3, 6) )
              .onsuccess = this.step_func(function onsuccess(_e)
            {
                assert_equals(e.target.result, "data3", "get(3-6)");
                this.done();
            })
        }
    })
})
