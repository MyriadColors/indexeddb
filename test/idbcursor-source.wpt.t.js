require('proof')(16, async okay => {
    await require('./harness')(okay, 'idbcursor-source')
    await harness(async () => {
        function cursor_source_test(test_name, name, stringified_object, cursor_rq_func) {
          indexeddb_test(
            (t, db, tx) => {
              var objStore = db.createObjectStore("my_objectstore");
              objStore.createIndex("my_index", "");

              objStore.add("data",  1);
              objStore.add("data2", 2);
            },
            (t, db) => {
              var cursor_rq = cursor_rq_func(db);

              cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
                if (!e.target.result) {
                  return;
                }
                var cursor = e.target.result;
                assert_readonly(cursor, 'source');

                // Direct try
                assert_true(cursor.source instanceof Object, "source isobject");
                assert_equals(cursor.source + "", stringified_object, "source");
                assert_equals(cursor.source.name, name, "name");

                cursor.continue();
              });

              cursor_rq.transaction.oncomplete = t.step_func(function oncomplete(e) {
                t.done();
              });

              cursor_rq.transaction.onerror = t.step_func(function onerror(e) {
                assert_unreached("Transaction got error. " + (e.target.error ? e.target.error.name : "unknown"));
              });
            },
            test_name
          );
        }

        cursor_source_test(
          document.title + ' - IDBObjectStore',
          "my_objectstore",
          "[object IDBObjectStore]",
          (db) => db.transaction("my_objectstore")
                                  .objectStore("my_objectstore")
                                  .openCursor()
        );

        cursor_source_test(
          document.title + ' - IDBIndex',
          "my_index",
          "[object IDBIndex]",
          (db) => db.transaction("my_objectstore")
                                  .objectStore("my_objectstore")
                                  .index("my_index")
                                  .openCursor()
        );
    })
})
