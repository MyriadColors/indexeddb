require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbobjectstore_delete5')
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
            var os = db.transaction("store", "readwrite")
                       .objectStore("store")

            os.delete( IDBKeyRange.bound(3, 6) )
            os.count().onsuccess = this.step_func(function onsuccess(_e)
            {
                assert_equals(e.target.result, 6, "Count after deleting 3-6 from 10");
                this.done();
            })
        }
    })
})
