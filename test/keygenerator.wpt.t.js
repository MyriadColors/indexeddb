require('proof')(3, async okay => {
    await require('./harness')(okay, 'keygenerator')
    await harness(async () => {
        function keygenerator(objects, expected_keys, desc) {
            let db,
              t = async_test(`${document.title} - ${desc}`);

            const open_rq = createdb(t);
            open_rq.onupgradeneeded = function onupgradeneeded(e) {
                db = e.target.result;
                const objStore = db.createObjectStore("store", { autoIncrement: true, keyPath: "id" });

                for (let i = 0; i < objects.length; i++)
                {
                    if (objects[i] === null)
                        {objStore.add({});}
                    else
                        {objStore.add({ id: objects[i] });}
                }
            };

            open_rq.onsuccess = function onsuccess(_e) {
                const actual_keys = [],
                  rq = db.transaction("store")
                         .objectStore("store")
                         .openCursor();

                rq.onsuccess = t.step_func(function onsuccess(_e) {
                    const cursor = e.target.result;

                    if (cursor) {
                        actual_keys.push(cursor.key.valueOf());
                        cursor.continue();
                    }
                    else {
                        assert_key_equals(actual_keys, expected_keys, "keygenerator array");
                        t.done();
                    }
                });
            };
        }


        keygenerator([null, null, null, null],  [1, 2, 3, 4],
            "starts at one, and increments by one");

        keygenerator([2, null, 5, null, 6.66, 7],  [2, 3, 5, 6, 6.66, 7],
            "increments by one from last set key");

        keygenerator([-10, null, "6", 6.3, [10], -2, 4, null],   [-10, -2, 1, 4, 6.3, 7, "6", [10]],
            "don't increment when new key is not bigger than current");

    })
})
