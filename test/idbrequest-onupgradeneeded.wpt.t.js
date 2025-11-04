require('proof')(6, async okay => {
    await require('./harness')(okay, 'idbrequest-onupgradeneeded')
    await harness(async () => {

        function upgradeneeded_test(upgrade_func, success_func, error_func, description) {
          async_test((t) => {
            var dbName = 'db' + self.location.pathname + '-' + description;
            var delete_request = indexedDB.deleteDatabase(dbName);
            delete_request.onerror = t.unreached_func('deleteDatabase should not fail');
            delete_request.onsuccess = t.step_func(function onsuccess() {
              var open_request = indexedDB.open(dbName);

              open_request.onupgradeneeded = t.step_func(function onupgradeneeded() {
                t.add_cleanup(function onupgradeneeded() {
                  if (open_request.result) {
                    open_request.result.close(),
                    indexedDB.deleteDatabase(dbName);
                  }
                });
                upgrade_func(t, open_request);
              });
              open_request.onsuccess = t.step_func(function onsuccess() {
                success_func(t, open_request);
              });
              if (error_func) {
                open_request.onerror = function onerror() { error_func(t, open_request); };
              } else {
                open_request.onerror = t.unreached_func('open failed');
              }
            });
          }, description);
        }

        (() => {
          var order = [];
          upgradeneeded_test(
            function upgrade(t, request) {
              order.push('Upgrade');
              var db = request.result;
              var deleteRequest = indexedDB.deleteDatabase(db.name);
              deleteRequest.onsuccess = t.step_func(function onsuccess() {
                assert_array_equals(order, ['Upgrade', 'Open Success']);
                t.done();
              });
              deleteRequest.onerror = t.unreached_func('delete failed');
            },
            function success(t, request) {
              var db = request.result;
              db.close();
              order.push('Open Success');
            },
            null,
            'indexedDB.delete called from upgradeneeded handler'
          );
        }());

        (() => {
          var order = [];
          upgradeneeded_test(
            function upgrade(t, request) {
              order.push('Upgrade');
              request.transaction.abort();
              order.push('Upgrade Transaction Aborted');
              var db = request.result;
              var deleteRequest = indexedDB.deleteDatabase(db.name);
              deleteRequest.onsuccess = t.step_func(function onsuccess() {
                assert_array_equals(
                    order, ['Upgrade', 'Upgrade Transaction Aborted', 'Open Error']);
                t.done();
              });
              deleteRequest.onerror = t.unreached_func('delete failed');
            },
            function success(t, request) {
              t.unreached_func('open should not succeed');
            },
            function error_func(t, request) {
              assert_array_equals(order, ['Upgrade', 'Upgrade Transaction Aborted']);
              order.push('Open Error');
            },
            'Abort transaction before deleting database in upgradeneeded handler'
          );
        }());

        (() => {
          var order = [];
          upgradeneeded_test(
            function upgrade(t, request) {
              order.push('Upgrade');
              var db = request.result;
              var deleteRequest = indexedDB.deleteDatabase(db.name);
              request.transaction.abort();
              order.push('Upgrade Transaction Aborted');
              deleteRequest.onsuccess = t.step_func(function onsuccess() {
                assert_array_equals(
                    order, ['Upgrade', 'Upgrade Transaction Aborted', 'Open Error']);
                t.done();
              });
              deleteRequest.onerror = t.unreached_func('delete failed');
            },
            function success(t, request) {
              t.unreached_func('open should not succeed');
            },
            function error_func(t, request) {
              assert_array_equals(order, ['Upgrade', 'Upgrade Transaction Aborted']);
              order.push('Open Error');
            },
            'Abort transaction after deleting database in upgradeneeded event handler'
          );
        }());

        (() => {
          var order = [];
          upgradeneeded_test(
            function upgrade(t, request) {
              order.push('Upgrade');
              var db = request.result;
              db.createObjectStore('store');
              request.transaction.oncomplete = t.step_func(function oncomplete() {
                order.push('Upgrade transaction complete');
                var txn = db.transaction('store', 'readwrite');
                var store = txn.objectStore('store');
                store.put('value', 'key');
                txn.oncomplete = t.step_func(function oncomplete() {
                  assert_array_equals(
                      order,
                      ['Upgrade', 'Upgrade transaction complete', 'Open Success']);
                  t.done();
                });
                txn.onerror = t.unreached_func('error on transaction');
                txn.onabort = t.unreached_func('aborting transaction');
              });
            },
            function success(t, request) {
              order.push('Open Success');
            },
            null,
            'transaction oncomplete ordering relative to open request onsuccess'
          );
        }());

    })
})
