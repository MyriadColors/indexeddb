require('proof')(14, async okay => {
    await require('./harness')(okay, 'idbindex_reverse_cursor')
    await harness(async () => {
        // META: title=Reverse Cursor Validity
        // META: script=support-promises.js

        async function iterateAndReturnAllCursorResult(testCase, cursor) {
          return new Promise((resolve, reject) => {
            const results = [];
            cursor.onsuccess = testCase.step_func(function onsuccess(_e) {
              const cursor = e.target.result;
              if (!cursor) {
                resolve(results);
                return;
              }
              results.push(cursor.value);
              cursor.continue();
            });
            cursor.onerror = reject;
          });
        }

        promise_test(async testCase => {
          const db = await createDatabase(testCase, db => {
            db.createObjectStore('objectStore', {keyPath: 'key'})
                      .createIndex('index', 'indexedOn');
          });
          const txn1 = db.transaction(['objectStore'], 'readwrite');
          txn1.objectStore('objectStore').add({'indexedOn': 3, 'key': 'firstItem'});
          const txn2 = db.transaction(['objectStore'], 'readwrite');
          txn2.objectStore('objectStore').put({'indexedOn': -1, 'key': 'firstItem'});
          const txn3= db.transaction(['objectStore'], 'readwrite');
          txn3.objectStore('objectStore').add({'indexedOn': 2, 'key': 'secondItem'});

          const txn4 = db.transaction(['objectStore'], 'readonly');
          const cursor = txn4.objectStore('objectStore').index('index').openCursor(IDBKeyRange.bound(0, 10), "prev");
          const results = await iterateAndReturnAllCursorResult(testCase, cursor);

          assert_equals(results.length, 1);

          await promiseForTransaction(testCase, txn4);
          db.close();
        }, 'Reverse cursor sees update from separate transactions.');

        promise_test(async testCase => {
          const db = await createDatabase(testCase, db => {
            db.createObjectStore('objectStore', {keyPath: 'key'})
                      .createIndex('index', 'indexedOn');
          });
          const txn = db.transaction(['objectStore'], 'readwrite');
          txn.objectStore('objectStore').add({'indexedOn': 2, 'key': '1'});
          txn.objectStore('objectStore').put({'indexedOn': -1, 'key': '1'});
          txn.objectStore('objectStore').add({'indexedOn': 1, 'key': '2'});

          const txn2 = db.transaction(['objectStore'], 'readonly');
          const cursor = txn2.objectStore('objectStore').index('index').openCursor(IDBKeyRange.bound(0, 10), "prev");
          const results = await iterateAndReturnAllCursorResult(testCase, cursor);

          assert_equals(1, results.length);

          await promiseForTransaction(testCase, txn2);
          db.close();
        }, 'Reverse cursor sees in-transaction update.');

    })
})
