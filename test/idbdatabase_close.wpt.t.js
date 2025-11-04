require('proof')(3, async okay => {
    await require('./harness')(okay, 'idbdatabase_close')
    await harness(async () => {
        var db;
        var versionchange_fired;
        var blocked_fired;
        var upgradeneeded_fired;
        var t = async_test();
        var open_rq = createdb(t);
        var counter = 0;

        open_rq.onupgradeneeded = function onupgradeneeded() {}
        open_rq.onsuccess = function onsuccess(_e) {
            db = e.target.result;
            db.onversionchange = t.step_func(function onversionchange(e) {
                versionchange_fired = counter++;
            });
            var rq = window.indexedDB.open(db.name, db.version + 1);
            rq.onblocked = t.step_func(function  onblocked(e) {
                blocked_fired = counter++;
                db.close();
            });
            rq.onupgradeneeded = t.step_func(function  onupgradeneeded(e) {
                upgradeneeded_fired = counter++;
            });
            rq.onsuccess = t.step_func(function  onsuccess(_e) {
                assert_equals(versionchange_fired, 0, 'versionchange event fired #')
                assert_equals(blocked_fired, 1, 'block event fired #')
                assert_equals(upgradeneeded_fired, 2, 'second upgradeneeded event fired #')

                rq.result.close();
                t.done();
            });
            rq.onerror = fail(t, 'Unexpected database deletion error');
        };

    })
})
