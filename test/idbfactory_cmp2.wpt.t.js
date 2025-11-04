require('proof')(7, async okay => {
    await require('./harness')(okay, 'idbfactory_cmp2')
    await harness(async () => {
        test( () => {
            assert_throws_js(TypeError, () => {
                indexedDB.cmp();
            });
        }, "IDBFactory.cmp() - no argument");

        test( () => {
            assert_throws_dom("DataError", () => {
                indexedDB.cmp(null, null);
            });
            assert_throws_dom("DataError", () => {
                indexedDB.cmp(1, null);
            });
            assert_throws_dom("DataError", () => {
                indexedDB.cmp(null, 1);
            });
        }, "IDBFactory.cmp() - null");

        test( () => {
            assert_throws_dom("DataError", () => {
                indexedDB.cmp(NaN, NaN);
            });
            assert_throws_dom("DataError", () => {
                indexedDB.cmp(1, NaN);
            });
            assert_throws_dom("DataError", () => {
                indexedDB.cmp(NaN, 1);
            });
        }, "IDBFactory.cmp() - NaN");
    })
})
