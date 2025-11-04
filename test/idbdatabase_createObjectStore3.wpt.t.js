require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbdatabase_createObjectStore3')
    await harness(async () => {

        var t = async_test(),
            open_rq = createdb(t)

        open_rq.onupgradeneeded = function onupgradeneeded() {}
        open_rq.onsuccess = function  onsuccess(_e) {
            var db = e.target.result
            assert_throws_dom(
                'InvalidStateError',
                function onsuccess() { db.createObjectStore('fails') })
            t.done();
        }

    })
})
