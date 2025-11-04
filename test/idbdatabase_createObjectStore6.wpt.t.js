require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbdatabase_createObjectStore6')
    await harness(async () => {

        var t = async_test(),
            open_rq = createdb(t)

        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            var db = e.target.result

            assert_throws_dom('SyntaxError', function onupgradeneeded() {
                    db.createObjectStore("invalidkeypath", { keyPath: "Invalid Keypath" })
                })

            assert_throws_dom('SyntaxError', function onupgradeneeded() {
                    db.createObjectStore("invalidkeypath", { autoIncrement: true,
                                                             keyPath: "Invalid Keypath" })
                })

            t.done()
        }

    })
})
