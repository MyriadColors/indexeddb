require('proof')(6, async okay => {
    await require('./harness')(okay, 'idbobjectstore_createIndex15-autoincrement')
    await harness(async () => {
        indexeddb_test(
          (t, db, txn) => {
            // No auto-increment
            var store = db.createObjectStore("Store1", {keyPath: "id"});
            store.createIndex("CompoundKey", ["num", "id"]);

            // Add data
            store.put({id: 1, num: 100});
          },
          (t, db) => {
            var store = db.transaction("Store1", "readwrite").objectStore("Store1");

            store.openCursor().onsuccess = t.step_func(function onsuccess(_e) {
              var item = e.target.result.value;
              store.index("CompoundKey").get([item.num, item.id]).onsuccess = t.step_func(function onsuccess(_e) {
                assert_equals(e.target.result ? e.target.result.num : null, 100, 'Expected 100.');
                t.done();
              });
            });
          },
          "Explicit Primary Key"
        );

        indexeddb_test(
          (t, db, txn) => {
            // Auto-increment
            var store = db.createObjectStore("Store2", {autoIncrement: true, keyPath: "id"});
            store.createIndex("CompoundKey", ["num", "id"]);

            // Add data
            store.put({num: 100});
          },
          (t, db) => {
            var store = db.transaction("Store2", "readwrite").objectStore("Store2");
            store.openCursor().onsuccess = t.step_func(function onsuccess(_e) {
              var item = e.target.result.value;
              store.index("CompoundKey").get([item.num, item.id]).onsuccess = t.step_func(function onsuccess(_e) {
                assert_equals(e.target.result ? e.target.result.num : null, 100, 'Expected 100.');
                t.done();
              });
            });
          },
          "Auto-Increment Primary Key"
        );

        indexeddb_test(
          (t, db, txn) => {
            // Auto-increment
            var store = db.createObjectStore("Store3", {autoIncrement: true, keyPath: "id"});
            store.createIndex("CompoundKey", ["num", "id", "other"]);

            var num = 100;

            // Add data to Store3 - valid keys
            // Objects will be stored in Store3 and keys will get added
            // to the CompoundKeys index.
            store.put({num: num++, other: 0});
            store.put({num: num++, other: [0]});

            // Add data - missing key
            // Objects will be stored in Store3 but keys won't get added to
            // the CompoundKeys index because the 'other' keypath doesn't
            // resolve to a value.
            store.put({num: num++});

            // Add data to Store3 - invalid keys
            // Objects will be stored in Store3 but keys won't get added to
            // the CompoundKeys index because the 'other' property values
            // aren't valid keys.
            store.put({num: num++, other: null});
            store.put({num: num++, other: {}});
            store.put({num: num++, other: [null]});
            store.put({num: num++, other: [{}]});
          },
          (t, db) => {
            var store = db.transaction("Store3", "readwrite").objectStore("Store3");
            const keys = [];
            let count;
            store.count().onsuccess = t.step_func(e => { count = e.target.result; });
            store.index("CompoundKey").openCursor().onsuccess = t.step_func(function onsuccess(_e) {
              const cursor = e.target.result;
              if (cursor !== null) {
                keys.push(cursor.key);
                cursor.continue();
                return;
              }

              // Done iteration, check results.
              assert_equals(count, 7, 'Expected all 7 records to be stored.');
              assert_equals(keys.length, 2, 'Expected exactly two index entries.');
              assert_array_equals(keys[0], [100, 1, 0]);
              assert_object_equals(keys[1], [101, 2, [0]]);
              t.done();
            });
          },
          "Auto-Increment Primary Key - invalid key values elsewhere"
        );
    })
})
