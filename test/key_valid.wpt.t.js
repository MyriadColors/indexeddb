require('proof')(90, async okay => {
    await require('./harness')(okay, 'key_valid')
    await harness(async () => {
        function valid_key(desc, key) {
            let db;
            const t = async_test(`${document.title} - ${desc}`);
            const open_rq = createdb(t);

            open_rq.onupgradeneeded = function onupgradeneeded(e) {
                db = e.target.result;

                const store = db.createObjectStore("store");
                assert_true(store.add('value', key) instanceof IDBRequest);

                const store2 = db.createObjectStore("store2", { keyPath: ["x", "keypath"] });
                assert_true(store2.add({ keypath: key, x: 'v' }) instanceof IDBRequest);
            };
            open_rq.onsuccess = function onsuccess(_e) {
                var rq = db.transaction("store")
                           .objectStore("store")
                           .get(key)
                rq.onsuccess = t.step_func(function onsuccess(e) {
                    assert_equals(e.target.result, 'value')
                    var rq = db.transaction("store2")
                               .objectStore("store2")
                               .get(['v', key])
                    rq.onsuccess = t.step_func(function onsuccess(e) {
                        assert_equals(e.target.result.x, 'v');
                        assert_key_equals(e.target.result.keypath, key);
                        t.done()
                    })
                })
            }
        }

        // Date
        valid_key( 'new Date()'    , new Date() );
        valid_key( 'new Date(0)'   , new Date(0) );

        // Array
        valid_key( '[]'            , [] );
        valid_key( 'new Array()'   , [] );

        valid_key( '["undefined"]' , ['undefined'] );

        // Float
        valid_key( 'Infinity'      , Infinity );
        valid_key( '-Infinity'     , -Infinity );
        valid_key( '0'             , 0 );
        valid_key( '1.5'           , 1.5 );
        valid_key( '3e38'          , 3e38 );
        valid_key( '3e-38'         , 3e38 );

        // String
        valid_key( '"foo"'         , "foo" );
        valid_key( String.raw`"\n"`         , "\n" );
        valid_key( '""'            , "" );
        valid_key( String.raw`"\""`         , "\"" );
        valid_key( String.raw`"\u1234"`     , "\u1234" );
        valid_key( String.raw`"\u0000"`     , "\u0000" );
        valid_key( '"NaN"'         , "NaN" );

    })
})
