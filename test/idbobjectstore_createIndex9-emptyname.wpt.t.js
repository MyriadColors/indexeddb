require('proof')(5, async okay => {
    await require('./harness')(okay, 'idbobjectstore_createIndex9-emptyname')
    await harness(async () => {
        var db

        var open_rq = createdb(async_test())
        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            db = e.target.result
            var store = db.createObjectStore("store")

            for (let i = 0; i < 5; i++)
                {store.add({ idx: "object_" + i }, i)}

            store.createIndex("", "idx")

            store.index("")
                 .get('object_4')
                 .onsuccess = this.step_func(function onsuccess(_e) {
                assert_equals(e.target.result.idx, 'object_4', 'result')
            })
            assert_equals(store.indexNames[0], "", "indexNames[0]")
            assert_equals(store.indexNames.length, 1, "indexNames.length")
        }

        open_rq.onsuccess = function onsuccess() {
            var store = db.transaction("store").objectStore("store")

            assert_equals(store.indexNames[0], "", "indexNames[0]")
            assert_equals(store.indexNames.length, 1, "indexNames.length")

            this.done()
        }
    })
})
