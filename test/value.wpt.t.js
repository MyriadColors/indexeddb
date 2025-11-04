require('proof')(4, async okay => {
    await require('./harness')(okay, 'value')
    await harness(async function () {
        function value(value, _instanceof) {
            var t = async_test(document.title + " - " + _instanceof.name);
            t.step(function() {
                assert_true(value instanceof _instanceof, "TEST ERROR, instanceof");
            });

            createdb(t).onupgradeneeded = function onupgradeneeded(e) {
                e.target.result
                        .createObjectStore("store")
                        .add(value, 1);

                e.target.onsuccess = t.step_func(function onsuccess(e) {
                    e.target.result
                            .transaction("store")
                            .objectStore("store")
                            .get(1)
                            .onsuccess = t.step_func(function onsuccess(e)
                    {
                        assert_true(e.target.result instanceof _instanceof, "instanceof")
                        t.done();
                    });
                });
            };
        }

        value(new Date(), Date);
        value([], Array);

    })
})
