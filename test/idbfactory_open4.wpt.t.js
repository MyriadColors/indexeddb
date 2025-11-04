require('proof')(2, async okay => {
    await require('./harness')(okay, 'idbfactory_open4')
    await harness(async () => {
        var open_rq = createdb(async_test(), document.location + '-database_name');

        open_rq.onupgradeneeded = function onupgradeneeded(e) {
            assert_equals(e.target.result.version, 1, "db.version");
        };
        open_rq.onsuccess = function onsuccess(_e) {
            assert_equals(e.target.result.version, 1, "db.version");
            this.done();
        };
    })
})
