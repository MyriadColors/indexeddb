require('proof')(1, async okay => {
    await require('./harness')(okay, 'idbobjectstore_createIndex11')
    await harness(async () => {
        var t = async_test(),
            open_rq = createdb(t);

        open_rq.onupgradeneeded = function  onupgradeneeded(e) {
            var db = e.target.result;
            var ostore = db.createObjectStore("store");
            assert_throws_dom("SyntaxError", function onupgradeneeded(){
                ostore.createIndex("ab", ".");
            });
            t.done();
        }
    })
})
