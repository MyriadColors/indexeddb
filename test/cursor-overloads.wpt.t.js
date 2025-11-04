require('proof')(66, async okay => {
    await require('./harness')(okay, 'cursor-overloads')
    await harness(async () => {

        let db, trans, store, index;
        const test = async_test();

        let request = createdb(test);
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            store = db.createObjectStore('store');
            index = store.createIndex('index', 'value');
            store.put({value: 0}, 0);
            trans = event.target.transaction;
            trans.oncomplete = verifyOverloads;
        };

        function verifyOverloads() {
            trans = db.transaction('store');
            store = trans.objectStore('store');
            index = store.index('index');

            checkCursorDirection("store.openCursor()", "next");
            checkCursorDirection("store.openCursor(0)", "next");
            checkCursorDirection("store.openCursor(0, 'next')", "next");
            checkCursorDirection("store.openCursor(0, 'nextunique')", "nextunique");
            checkCursorDirection("store.openCursor(0, 'prev')", "prev");
            checkCursorDirection("store.openCursor(0, 'prevunique')", "prevunique");

            checkCursorDirection("store.openCursor(IDBKeyRange.only(0))", "next");
            checkCursorDirection("store.openCursor(IDBKeyRange.only(0), 'next')", "next");
            checkCursorDirection("store.openCursor(IDBKeyRange.only(0), 'nextunique')", "nextunique");
            checkCursorDirection("store.openCursor(IDBKeyRange.only(0), 'prev')", "prev");
            checkCursorDirection("store.openCursor(IDBKeyRange.only(0), 'prevunique')", "prevunique");

            checkCursorDirection("index.openCursor()", "next");
            checkCursorDirection("index.openCursor(0)", "next");
            checkCursorDirection("index.openCursor(0, 'next')", "next");
            checkCursorDirection("index.openCursor(0, 'nextunique')", "nextunique");
            checkCursorDirection("index.openCursor(0, 'prev')", "prev");
            checkCursorDirection("index.openCursor(0, 'prevunique')", "prevunique");

            checkCursorDirection("index.openCursor(IDBKeyRange.only(0))", "next");
            checkCursorDirection("index.openCursor(IDBKeyRange.only(0), 'next')", "next");
            checkCursorDirection("index.openCursor(IDBKeyRange.only(0), 'nextunique')", "nextunique");
            checkCursorDirection("index.openCursor(IDBKeyRange.only(0), 'prev')", "prev");
            checkCursorDirection("index.openCursor(IDBKeyRange.only(0), 'prevunique')", "prevunique");

            checkCursorDirection("index.openKeyCursor()", "next");
            checkCursorDirection("index.openKeyCursor(0)", "next");
            checkCursorDirection("index.openKeyCursor(0, 'next')", "next");
            checkCursorDirection("index.openKeyCursor(0, 'nextunique')", "nextunique");
            checkCursorDirection("index.openKeyCursor(0, 'prev')", "prev");
            checkCursorDirection("index.openKeyCursor(0, 'prevunique')", "prevunique");

            checkCursorDirection("index.openKeyCursor(IDBKeyRange.only(0))", "next");
            checkCursorDirection("index.openKeyCursor(IDBKeyRange.only(0), 'next')", "next");
            checkCursorDirection("index.openKeyCursor(IDBKeyRange.only(0), 'nextunique')", "nextunique");
            checkCursorDirection("index.openKeyCursor(IDBKeyRange.only(0), 'prev')", "prev");
            checkCursorDirection("index.openKeyCursor(IDBKeyRange.only(0), 'prevunique')", "prevunique");

            test.done();
        }

        function checkCursorDirection(statement, direction) {
            // Parse statement like "store.openCursor(0, 'next')" or "index.openKeyCursor()"
            const match = statement.match(/^(store|index)\.(openCursor|openKeyCursor)\(([^)]*)\)$/);
            if (!match) {
                throw new Error(`Invalid statement format: ${statement}`);
            }
            
            const [, objName, methodName, argsStr] = match;
            const obj = objName === 'store' ? store : index;
            const method = obj[methodName];
            
            // Parse arguments
            const args = [];
            if (argsStr.trim()) {
                const parts = argsStr.split(',').map(s => s.trim());
                for (const part of parts) {
                    if (part.startsWith("IDBKeyRange.only(")) {
                        // Extract the number from IDBKeyRange.only(0)
                        const numMatch = part.match(/IDBKeyRange\.only\((\d+)\)/);
                        if (numMatch) {
                            args.push(IDBKeyRange.only(Number(numMatch[1])));
                        }
                    } else if (/^'\w+'$/.test(part)) {
                        // String argument like 'next'
                        args.push(part.slice(1, -1));
                    } else if (/^\d+$/.test(part)) {
                        // Numeric argument
                        args.push(Number(part));
                    }
                }
            }
            
            request = method.apply(obj, args);
            request.onsuccess = function onsuccess(event) {
                assert_not_equals(event.target.result, null, "Check the result is not null")
                assert_equals(event.target.result.direction, direction, "Check the result direction");
            };
        }

    })
})
