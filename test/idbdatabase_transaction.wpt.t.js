require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbdatabase_transaction')
    await harness(async () => {

        var db,
          t = async_test(),
          open_rq = createdb(t);

        open_rq.onupgradeneeded = function onupgradeneeded() {};
        open_rq.onsuccess = function onsuccess(_e) {
            db = e.target.result;

            assert_throws_dom('NotFoundError', function onsuccess() { db.transaction('non-existing'); });
            t.done();
        };

    })
})
