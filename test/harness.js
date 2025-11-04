module.exports = async (okay, name) => {
    const { Future } = require('perhaps')
    const Destructible = require('destructible')
    const fs = require('node:fs').promises
    const assert = require('node:assert')
    const path = require('node:path')
    const { coalesce } = require('node:extant')
    const directory = path.join(__dirname, 'tmp', name)
    await coalesce(fs.rm, fs.rmdir).call(fs, directory, { force: true, recursive: true })
    await fs.mkdir(directory, { recursive: true })
    function globalize (value, name = null) {
        if (name === null) {
            switch (typeof value) {
            case 'function': {
                global[value.name] = value
                okay.leak(value.name)
            }
            }
        } else {
            global[name] = value
            okay.leak(name)
        }
    }
    // TODO Remove these global leaks by creating your own implementation of
    // structured clone throwing.
    okay.leak('DOMException')
    okay.leak('core')
    okay.leak('__core-js_shared__')
    globalize('wpt', 'location')
    globalize({ location: { pathname: 'wpt' } }, 'self')
    globalize({
        getElementsByTagName(name) {
          console.log('getElementsByTagName', name)
            return {
                insertBefore () { console.log('insertBefore') }, nodeType: 0
            }
        }, insertBefore: function  insertBefore() { console.log('insertBefore') }, location: 'wpt', nodeType: 0, title: 'wpt'
    }, 'document')
    //const { IDBDatabase } = require('../database')
    /*
    globalize(DBDatabase, 'IDBDatabase')
    const { DBTransaction } = require('../transaction')
    globalize(DBRequest, 'IDBRequest')
    globalize(DBOpenDBRequest, 'IDBOpenDBRequest')
    globalize(DBTransaction, 'IDBTransaction')
    globalize(DBVersionChangeEvent, 'IDBVersionChangeEvent')
    const { DBKeyRange } = require('../keyrange')
    globalize(DBKeyRange, 'IDBKeyRange')
    */
    const destructible = new Destructible(5000, 'harness')
    const globalObject = require('..')
    const indexedDB = globalObject.create(destructible, directory)
    globalize(globalObject.IDBVersionChangeEvent)
    globalize(globalObject.IDBIndex)
    globalize(globalObject.IDBCursor)
    globalize(globalObject.IDBCursorWithValue)
    globalize(globalObject.IDBKeyRange)
    globalize(globalObject.IDBOpenDBRequest)
    globalize(globalObject.IDBRequest)
    globalize(globalObject.IDBObjectStore)
    globalize(globalObject.IDBTransaction)
    globalize(globalObject.IDBDatabase)
    const comparator = require('../compare')
    const compare = (left, right) => comparator(globalObject, left, right)
    if (process.versions.node.split('.')[0] < 15) {
        globalize(globalObject.Event)
    } else {
        global.Event = globalObject.Event
    }
    globalize(indexedDB, 'indexedDB')
    globalize({ indexedDB }, 'window')
    // Copy and paste from WPT.

    const replacements = {
        "0": "0", "0xfffd": "ufffd", "0xfffe": "ufffe", "0xffff": "uffff", "1": "x01", "10": "n", "11": "v", "12": "f", "13": "r", "14": "x0e", "15": "x0f", "16": "x10", "17": "x11", "18": "x12", "19": "x13", "2": "x02", "20": "x14", "21": "x15", "22": "x16", "23": "x17", "24": "x18", "25": "x19", "26": "x1a", "27": "x1b", "28": "x1c", "29": "x1d", "3": "x03", "30": "x1e", "31": "x1f", "4": "x04", "5": "x05", "6": "x06", "7": "x07", "8": "b", "9": "t",
    }
    function format_value(val, seen)
    {
        var ret, i;
        if (!seen) {
            seen = [];
        }
        if (typeof val === "object" && val !== null) {
            if (seen.indexOf(val) >= 0) {
                return "[...]";
            }
            seen.push(val);
        }
        if (Array.isArray(val)) {
            let output = "[";
            if (val.beginEllipsis !== undefined) {
                output += "…, ";
            }
            output += val.map((x) => format_value(x, seen)).join(", ");
            if (val.endEllipsis !== undefined) {
                output += ", …";
            }
            return `${output}]`;
        }
        let replace;
        switch (typeof val) {
        case "string": {
            val = val.replaceAll(/\\/g, "\\\\");
            for (var p in replacements) {
                replace = `\\${replacements[p]}`;
                val = val.replace(RegExp(String.fromCodePoint(p), "g"), replace);
            }
            return `"${val.replaceAll(/"/g, String.raw`\"`)}"`;
        }
        case "boolean":
        case "undefined": {
            return String(val);
        }
        case "number": {
            // In JavaScript, -0 === 0 and String(-0) === "0", so we have to
            // special-case.
            if (val === 0 || (val !== 0 && 1/val === -Infinity)) {
                return "-0";
            }
            return String(val);
        }
        case "object": {
            if (val === null) {
                return "null";
            }

            // Special-case Node objects, since those come up a lot in my tests.
            // I
            // ignore namespaces.
            if (is_node(val)) {
                switch (val.nodeType) {
                case Node.ELEMENT_NODE: {
                    ret = `<${val.localName}`;
                    for (i = 0; i < val.attributes.length; i++) {
                        ret += ` ${val.attributes[i].name}="${val.attributes[i].value}"`;
                    }
                    ret += `>${val.innerHTML}</${val.localName}>`;
                    return `Element node ${truncate(ret, 60)}`;
                }
                case Node.TEXT_NODE: {
                    return `Text node "${truncate(val.data, 60)}"`;
                }
                case Node.PROCESSING_INSTRUCTION_NODE: {
                    return `ProcessingInstruction node with target ${format_value(truncate(val.target, 60))} and data ${format_value(truncate(val.data, 60))}`;
                }
                case Node.COMMENT_NODE: {
                    return `Comment node <!--${truncate(val.data, 60)}-->`;
                }
                case Node.DOCUMENT_NODE: {
                    return `Document node with ${val.childNodes.length} ${val.childNodes.length === 1 ? "child" : "children"}`;
                }
                case Node.DOCUMENT_TYPE_NODE: {
                    return "DocumentType node";
                }
                case Node.DOCUMENT_FRAGMENT_NODE: {
                    return `DocumentFragment node with ${val.childNodes.length} ${val.childNodes.length === 1 ? "child" : "children"}`;
                }
                default: {
                    return "Node object of unknown type";
                }
                }
            }
            break;
        }
        }
        try {
            return `${typeof val} "${truncate(String(val), 1000)}"`;
        } catch(error) {
            return `[stringifying object threw ${String(error)} with type ${String(typeof error)}]`;
        }
    }
    globalize(format_value)
    function setup () {}
    globalize(setup)
    const tests = []
    let count = 0
    class Test {
        constructor (future, name, properties) {
            this.name = name || `test-${++count}`
            this.phase = this.phases.INITIAL
            this.status = this.statuses.NORUN
            this.timeout_id = null
            this._janitors = []
            this.index = null
            this.properites = properties || {}
            this._future = future
            tests.push(this)
        }
        statuses = {
            FAIL:1, NOTRUN:3, PASS:0, PRECONDITION_FAILED:4, TIMEOUT:2
        }
        phases = {
            CLEANING:3, COMPLETE:4, HAS_RESULT:2, INITIAL:0, STARTED:1
        }
        unreached_func (description) {
            return this.step_func(() => {
                throw new Error(`should not reach: ${description}`)
            })
        }
        step (func, ...vargs) {
            const self = vargs.length === 0 ? this : vargs.shift()
            if (this.phase > this.phases.STARTED) {
                return
            }
            this.phase = this.phases.STARTED
                scope.name = this.name
                return func.apply(self, vargs)
        }
        step_func (...args) {
            const f = args[0]
            const self = args.length === 1 ? this : args[1]
            const step = this.step
            return (...vargs) => {
                return step.apply(self, [ f, self ].concat(vargs))
            }
        }
        step_func_done (...args) {
            const f = args[0]
            const self = args.length === 1 ? this : args[1]
            return function  exports(...vargs) {
                if (f) {
                    this.step.apply(self, [ f, self ].concat(vargs))
                }
                this.done()
            }.bind(this)
        }
        add_cleanup (f) {
            this._janitors.push(f)
        }
        done () {
            this.phase = this.phases.COMPLETE
            while (this._janitors.length > 0) {
                this._janitors.shift()()
            }
            this._future.resolve()
        }
    }
    globalize(Test)
    const scope = {}, futures = []
    function async_test (...vargs) {
        const f = typeof vargs[0] === 'function' ? vargs.shift() : null
        scope.name = typeof vargs[0] === 'string' ? vargs.shift() : name
        const _properties = vargs.pop() || null
        scope.count = 0
        const future = new Future
        futures.push(future)
        if (f !== null) {
            f(new Test(future, scope.name))
        }
        return new Test(future, scope.name)
    }
    globalize(async_test)
    function test (f, name) {
        scope.name = name
        scope.count = 0
        f()
    }
    globalize(test)
    function step_timeout (f, t, ...vargs) {
        setTimeout(function  exports() {
            f.apply(this, vargs)
        }.bind(this), t)
    }
    globalize(step_timeout)
    function fail (_test, message) {
        return (e) => {
            if (e?.message && e.target.error) {
                assert.fail(`${message} (${e.target.error.name}: ${e.message})`)
            } else if (e?.message) {
                assert.fail(`${message} (${e.message})`)
            } else if (e && e.target.readyState === 'done' && e.target.error) {
                assert.fail(`${message} (${e.target.error.name})`)
            } else {
                assert.fail(message)
            }
        }
    }
    globalize(fail)
    function get_assertion_message(message) {
        if (!message) {
            message = `assertion ${scope.count++}`
        }
        return message
    }
    function assert_true (condition, message) {
        okay(condition, get_assertion_message(message))
    }
    globalize(assert_true)
    function assert_false (condition, message) {
        okay(! condition, get_assertion_message(message))
    }
    globalize(assert_false)
    function assert_equals (actual, expected, message) {
        okay(actual, expected, `${scope.name} - ${get_assertion_message(message)}`)
    }
    globalize(assert_equals)
    function assert_object_equals (actual, expected, message) {
        okay(actual, expected, `${scope.name} - ${get_assertion_message(message)}`)
    }
    globalize(assert_object_equals)
    function assert_not_equals (actual, expected, message) {
        okay(actual !== expected, `${scope.name} - ${get_assertion_message(message)}`)
    }
    globalize(assert_not_equals)
    function assert_key_equals (actual, expected, message)  {
        assert_equals(compare(actual, expected), 0, message)
    }
    globalize(assert_key_equals)
    function assert_class_string (object, className, message) {
        const actual = Object.prototype.toString.call(object)
        okay(`[object ${className}]`, actual, get_assertion_message(message))
    }
    globalize(assert_class_string)
    function toArray (list) {
        if (list instanceof globalObject.DOMStringList) {
            const copy = []
            for (let i = 0; i < list.length; i++) {
                copy.push(list.item(i))
            }
            return copy
        }
        return list
    }
    function assert_array_equals (actual, expected, message) {
        assert_equals(toArray(actual), toArray(expected), message)
    }
    globalize(assert_array_equals)
    function assert_readonly (object, property, message) {
        const save = object[property]
        try {
            object[property] = `${save}a`
            okay(object[property], save, message)
        } finally {
            object[property] = save
        }
    }
    globalize(assert_readonly)
    function assert_throws_js(expectedConstructor, func, message) {
        if (!message) {
            message = `assertion ${scope.count++}`
        }
        try {
            func.call(null)
            assert(false, 'did not throw')
        } catch (error) {
            if (error instanceof assert.AssertionError) {
                throw error
            }
            if (error.constructor !== expectedConstructor) {
                console.log(error.stack)
            }
            okay(error.constructor === expectedConstructor, `${scope.name} - ${message}`)
        }
    }
    globalize(assert_throws_js)
    function assert_throws_exactly (exception, func, description, _assertion_type) {
        try {
            func.call(null)
            assert(false, 'did not throw')
        } catch (error) {
            assert_true(error === exception, description)
        }
    }
    globalize(assert_throws_exactly)
    const DOM_ERROR_NAMES = Object.freeze({
        ABORT_ERR: 'AbortError', DATA_CLONE_ERR: 'DataCloneError', HIERARCHY_REQUEST_ERR: 'HierarchyRequestError', INDEX_SIZE_ERR: 'IndexSizeError', INUSE_ATTRIBUTE_ERR: 'InUseAttributeError', INVALID_ACCESS_ERR: 'InvalidAccessError', INVALID_CHARACTER_ERR: 'InvalidCharacterError', INVALID_MODIFICATION_ERR: 'InvalidModificationError', INVALID_NODE_TYPE_ERR: 'InvalidNodeTypeError', INVALID_STATE_ERR: 'InvalidStateError', NAMESPACE_ERR: 'NamespaceError', NETWORK_ERR: 'NetworkError', NOT_FOUND_ERR: 'NotFoundError', NOT_SUPPORTED_ERR: 'NotSupportedError', NO_MODIFICATION_ALLOWED_ERR: 'NoModificationAllowedError', QUOTA_EXCEEDED_ERR: 'QuotaExceededError', SECURITY_ERR: 'SecurityError', SYNTAX_ERR: 'SyntaxError', TIMEOUT_ERR: 'TimeoutError', TYPE_MISMATCH_ERR: 'TypeMismatchError', URL_MISMATCH_ERR: 'URLMismatchError', WRONG_DOCUMENT_ERR: 'WrongDocumentError'
    });

    const DOM_ERROR_CODES = Object.freeze({
        AbortError: 20, ConstraintError: 0, DataCloneError: 25, DataError: 0, EncodingError: 0, HierarchyRequestError: 3, InUseAttributeError: 10, IndexSizeError: 1, InvalidAccessError: 15, InvalidCharacterError: 5, InvalidModificationError: 13, InvalidNodeTypeError: 24, InvalidStateError: 11, NamespaceError: 14, NetworkError: 19, NoModificationAllowedError: 7, NotAllowedError: 0, NotFoundError: 8, NotReadableError: 0, NotSupportedError: 9, OperationError: 0, QuotaExceededError: 22, ReadOnlyError: 0, SecurityError: 18, SyntaxError: 12, TimeoutError: 23, TransactionInactiveError: 0, TypeMismatchError: 17, URLMismatchError: 21, UnknownError: 0, VersionError: 0, WrongDocumentError: 4
    });

    // Build reverse mapping: code -> error name for human-readable error messages
    const DOM_ERROR_CODE_NAMES = Object.freeze((() => {
        const codeNames = {}
        for (const key in DOM_ERROR_CODES) {
            codeNames[DOM_ERROR_CODES[key]] = key
        }
        return codeNames
    })());

    function assert_throws_dom(type, func, description) {
        try {
            func.call(null)
            okay(false, `failed to throw ${description}`)
        } catch (error) {
            if (error instanceof assert.AssertionError) {
                throw error
            }

            // Translate error constant name to error class name if needed
            const expectedName = DOM_ERROR_NAMES[type] || type
            const expectedCode = DOM_ERROR_CODES[expectedName]

            // Get human-readable names for better error messages
            const actualErrorName = DOM_ERROR_CODE_NAMES[error.code] || error.name || `Unknown (code: ${error.code})`
            const expectedErrorName = expectedName || `Unknown`

            assert_equals({
                code: error.code, name: error.name
            }, {
                code: expectedCode, name: expectedName,
            }, description || `Expected ${expectedErrorName} (code: ${expectedCode}), got ${actualErrorName} (code: ${error.code})`)

            if (typeof type === 'number') {
                throw new TypeError
            }
        }
    }
    globalize(assert_throws_dom)
    function add_test_done_callback (test, callback) {
        if (test.phase === test.phases.COMPLETED) {
            callback()
        } else {
            test._janitors.push(callback)
        }
    }
    function promise_test(func, name, properties) {
        if (typeof func !== 'function') {
            properties = name;
            name = func;
            func = null;
        }
        if (name === null) {
            name = `promise-test-${count++}`
        }
        const future = new Future
        futures.push(future)
        const test = new Test(future, name, properties);
        test._is_promise_test = true;

        // If there is no promise tests queue make one.
        if (!tests.promise_tests) {
            tests.promise_tests = Promise.resolve();
        }
        tests.promise_tests = tests.promise_tests.then(() => {
            return new Promise((resolve) => {
                const promise = test.step(func, test, test);

                test.step(() => {
                    assert(!!promise, "promise_test", null,
                           `test body must return a 'thenable' object (received ` + String(promise) + `)`,
                           {value:promise});
                    assert(typeof promise.then === "function", "promise_test", null,
                           "test body must return a 'thenable' object (received an object with no `then` method)",
                           null);
                });

                // Test authors may use the `step` method within a
                // `promise_test` even though this reflects a mixture of
                // asynchronous control flow paradigms. The "done" callback
                // should be registered prior to the resolution of the
                // user-provided Promise to avoid timeouts in cases where the
                // Promise does not settle but a `step` function has thrown an
                // error.
                add_test_done_callback(test, resolve);

                Promise.resolve(promise)
                    .catch(test.step_func(
                        (value) => {
                            if (value instanceof assert.AssertionError) {
                                throw value;
                            }
                            console.log(value.stack)
                            assert(false, "promise_test", null,
                                   `Unhandled rejection with value: ` + String(value), {value:value});
                        }))
                    .then(() => {
                        test.done()
                    })
            })
        })
    }
    globalize(promise_test)
    const janitors = []
    function add_completion_callback (janitor) {
        janitors.push(janitor)
    }
    globalize(add_completion_callback)
    // `createdb(test[, name][, version])`
    //
    // Create a database with an optional name that always includes a random
    // suffix and an optional version. If there is no version the database is
    // opened without a version.
    //
    // We set handlers for the error states error, abort and version change and
    // raise an exception if the user has not explicitly set a handler for those
    // events.
    function createdb (test, ...vargs) {
        const name = vargs.shift() || `test-db${Date.now()}${Math.random()}`
        const version = vargs.shift() || null
        const request = version ? indexedDB.open(name, version) : indexedDB.open(name)
        const handled = {}
        function fail (eventName, currentTest) {
            request.addEventListener(eventName, (event) => {
                if (currentTest === test) {
                    // This step thing kills me. It's a synchronous function. What's
                    // the point?
                    // TODO: Consider if we should use a Promise instead.
                    test.step(() => {
                        if (! handled[eventName]) {
                            assert(false, `unexpected open.${eventName} event`)
                        }
                        // What are we asserting here?
                        if (! this.db) {
                            this.db = event.target.result
                            //this.db.onerror = fail(test, 'unexpected db.error')
                            //this.db.onabort = fail(test, 'unexpected db.abort')
                            //this.db.onversionchange = fail(test, 'unexpected db.abort')
                        }
                    })
                }
            })
            request.__defineSetter__(`on${eventName}`, (handler) => {
                handled[eventName] = true
                if (! handler) {
                    request.addEventListener(eventName, () => {})
                } else {
                    request.addEventListener(eventName, test.step_func(handler))
                }
            })
        }
        fail('upgradeneeded', test)
        fail('success', test)
        fail('blocked', test)
        fail('error', test)
        return request
    }
    globalize(createdb)
    async function harness (f) {
        destructible.promise.catch(error => console.log(error.stack))
        add_completion_callback(() => {
            for (const test of tests) {
                if (test.db) {
                    test.db.close()
                    indexedDB.deleteDatabase(test.db.name)
                }
            }
        })
        await f()
        while (futures.length > 0) {
            await futures.shift().promise
        }
        while (janitors.length > 0) {
            janitors.shift()()
        }
        await destructible.destroy().promise
    }
    globalize(harness)
    let nameCount = 0
    function indexeddb_test(upgrade_func, open_func, description, options) {
      async_test((t) => {
        options = {upgrade_will_abort: false, ...options};
        var dbname = `${location}-${t.name}-${++nameCount}`;
        var del = indexedDB.deleteDatabase(dbname);
        del.onerror = t.unreached_func('deleteDatabase should succeed');
        var open = indexedDB.open(dbname, 1);
        open.onupgradeneeded = t.step_func(() => {
          var db = open.result;
          t.add_cleanup(() => {
            // If open didn't succeed already, ignore the error.
            open.onerror = (e) => {
              e.preventDefault();
            };
            db.close();
            indexedDB.deleteDatabase(db.name);
          });
          var tx = open.transaction;
          upgrade_func(t, db, tx, open);
        });
        if (options.upgrade_will_abort) {
          open.onsuccess = t.unreached_func('open should not succeed');
        } else {
          open.onerror = t.unreached_func('open should succeed');
          open.onsuccess = t.step_func(() => {
            var db = open.result;
            if (open_func)
              {open_func(t, db, open);}
          });
        }
      }, description);
    }
    globalize(indexeddb_test)


    /**
     * This constructor helper allows DOM events to be handled using Promises,
     * which can make it a lot easier to test a very specific series of events,
     * including ensuring that unexpected events are not fired at any point.
     */
    function EventWatcher(test, watchedNode, eventTypes, timeoutPromise)
    {
        if (typeof eventTypes === 'string') {
            eventTypes = [eventTypes];
        }

        var waitingFor = null;

        // This is null unless we are recording all events, in which case it
        // will be an Array object.
        var recordedEvents = null;

        var eventHandler = test.step_func((evt) => {
            assert_true(!!waitingFor,
                        `Not expecting event, but got ${evt.type} event`);
            assert_equals(evt.type, waitingFor.types[0],
                          `Expected ${waitingFor.types[0]} event, but got ${evt.type} event instead`);

            if (Array.isArray(recordedEvents)) {
                recordedEvents.push(evt);
            }

            if (waitingFor.types.length > 1) {
                // Pop first event from array
                waitingFor.types.shift();
                return;
            }
            // We need to null out waitingFor before calling the resolve
            // function
            // since the Promise's resolve handlers may call wait_for() which
            // will
            // need to set waitingFor.
            var resolveFunc = waitingFor.resolve;
            waitingFor = null;
            // Likewise, we should reset the state of recordedEvents.
            var result = recordedEvents || evt;
            recordedEvents = null;
            resolveFunc(result);
        })

        for (let i = 0; i < eventTypes.length; i++) {
            watchedNode.addEventListener(eventTypes[i], eventHandler, false);
        }

        /**
         * Returns a Promise that will resolve after the specified event or
         * series of events has occurred.
         *
         * @param options An optional options object. If the 'record' property
         *                on this object has the value 'all', when the Promise
         *                returned by this function is resolved,  *all* Event
         *                objects that were waited for will be returned as an
         *                array.
         *
         * For example,
         *
         * ```js
         * const watcher = new EventWatcher(t, div, [ 'animationstart',
         *                                            'animationiteration',
         *                                            'animationend' ]);
         * return watcher.wait_for([ 'animationstart', 'animationend' ],
         *                         { record: 'all' }).then(evts => {
         *   assert_equals(evts[0].elapsedTime, 0.0);
         *   assert_equals(evts[1].elapsedTime, 2.0);
         * });
         * ```
         */
        this.wait_for = (types, options) => {
            if (waitingFor) {
                return Promise.reject('Already waiting for an event or events');
            }
            if (typeof types === 'string') {
                types = [types];
            }
            if (options?.record && options.record === 'all') {
                recordedEvents = [];
            }
            return new Promise((resolve, reject) => {
                var timeout = test.step_func(() => {
                    // If the timeout fires after the events have been received
                    // or during a subsequent call to wait_for, ignore it.
                    if (!waitingFor || waitingFor.resolve !== resolve)
                        {return;}

                    // This should always fail, otherwise we should have
                    // resolved the promise.
                    assert_true(waitingFor.types.length === 0,
                                `Timed out waiting for ${waitingFor.types.join(', ')}`);
                    var result = recordedEvents;
                    recordedEvents = null;
                    var resolveFunc = waitingFor.resolve;
                    waitingFor = null;
                    resolveFunc(result);
                });

                if (timeoutPromise) {
                    timeoutPromise().then(timeout);
                }

                waitingFor = {
                    reject: reject, resolve: resolve, types: types
                };
            });
        };

        function stop_watching() {
            for (let i = 0; i < eventTypes.length; i++) {
                watchedNode.removeEventListener(eventTypes[i], eventHandler, false);
            }
        }

        test._janitors.push(stop_watching);

        return this;
    }


    // Returns an IndexedDB database name that is unique to the test case.
    function databaseName(testCase) {
      return `db-wpt-${testCase.name}`;
    }
    globalize(databaseName)

    // EventWatcher covering all the events defined on IndexedDB requests.
    //
    // The events cover IDBRequest and IDBOpenDBRequest.
    function requestWatcher(testCase, request) {
      return new EventWatcher(testCase, request,
                              ['blocked', 'error', 'success', 'upgradeneeded']);
    }

    // EventWatcher covering all the events defined on IndexedDB transactions.
    //
    // The events cover IDBTransaction.
    function transactionWatcher(testCase, request) {
      return new EventWatcher(testCase, request, ['abort', 'complete', 'error']);
    }

    // Promise that resolves with an IDBRequest's result.
    //
    // The promise only resolves if IDBRequest receives the "success" event. Any
    // other event causes the promise to reject with an error. This is correct in
    // most cases, but insufficient for indexedDB.open(), which issues
    // "upgradeneded" events under normal operation.
    function promiseForRequest(testCase, request) {
      const eventWatcher = requestWatcher(testCase, request);
      return eventWatcher.wait_for('success').then(event => {
        return event.target.result
      });
    }
    globalize(promiseForRequest)

    // Promise that resolves when an IDBTransaction completes.
    //
    // Migrates an IndexedDB database whose name is unique for the test case.
    //
    // newVersion must be greater than the database's current version.
    //
    // migrationCallback will be called during a versionchange transaction and will
    // given the created database, the versionchange transaction, and the database
    // open request.
    //
    // Creates an IndexedDB database whose name is unique for the test case.
    //
    // setupCallback will be called during a versionchange transaction, and will be
    // given the created database, the versionchange transaction, and the database
    // open request.
    //
    // Returns a promise that resolves to an IndexedDB database. The caller should
    // close the database.
    function createDatabase(testCase, setupCallback) {
      return createNamedDatabase(testCase, databaseName(testCase), setupCallback);
    }
    globalize(createDatabase)

    // Creates an IndexedDB database.
    //
    // setupCallback will be called during a versionchange transaction, and will be
    // given the created database, the versionchange transaction, and the database
    // open request.
    //
    // Returns a promise that resolves to an IndexedDB database. The caller should
    // close the database.
    function createNamedDatabase(testCase, databaseName, setupCallback) {
      const request = indexedDB.deleteDatabase(databaseName);
      return promiseForRequest(testCase, request).then(() => {
        testCase.add_cleanup(() => { indexedDB.deleteDatabase(databaseName); });
        return migrateNamedDatabase(testCase, databaseName, 1, setupCallback)
      });
    }

    // Opens an IndexedDB database without performing schema changes.
    //
    // The given version number must match the database's current version.
    //
    // Returns a promise that resolves to an IndexedDB database. The caller should
    // close the database.
    function openDatabase(testCase, version) {
      return openNamedDatabase(testCase, databaseName(testCase), version);
    }
    globalize(openDatabase)

    // Opens an IndexedDB database without performing schema changes.
    //
    // The given version number must match the database's current version.
    //
    // Returns a promise that resolves to an IndexedDB database. The caller should
    // close the database.
    function openNamedDatabase(testCase, databaseName, version) {
      const request = indexedDB.open(databaseName, version);
      return promiseForRequest(testCase, request).then(database => {
        testCase.add_cleanup(() => { database.close(); });
        return database;
      });
    }

    // The data in the 'books' object store records in the first example of the
    // IndexedDB specification.
    const BOOKS_RECORD_DATA = [
      { author: 'Fred', isbn: 123_456, title: 'Quarry Memories' },
      { author: 'Fred', isbn: 234_567, title: 'Water Buffaloes' },
      { author: 'Barney', isbn: 345_678, title: 'Bedrock Nights' },
    ];

    globalize(BOOKS_RECORD_DATA, 'BOOKS_RECORD_DATA')

    // Creates a 'books' object store whose contents closely resembles the first
    // example in the IndexedDB specification.
    const createBooksStore = (_testCase, database) => {
      const store = database.createObjectStore('books',
          { autoIncrement: true, keyPath: 'isbn' });
      store.createIndex('by_author', 'author');
      store.createIndex('by_title', 'title', { unique: true });
      for (const record of BOOKS_RECORD_DATA)
          {store.put(record);}
      return store;
    }
    globalize(createBooksStore)

    // Creates a 'books' object store whose contents closely resembles the first
    // example in the IndexedDB specification, just without autoincrementing.
    const _createBooksStoreWithoutAutoIncrement = (_testCase, database) => {
      const store = database.createObjectStore('books',
          { keyPath: 'isbn' });
      store.createIndex('by_author', 'author');
      store.createIndex('by_title', 'title', { unique: true });
      for (const record of BOOKS_RECORD_DATA)
          {store.put(record);}
      return store;
    }

    // Verifies that an object store's indexes match the indexes used to create the
    // books store in the test database's version 1.
    //
    // The errorMessage is used if the assertions fail. It can state that the
    // IndexedDB implementation being tested is incorrect, or that the testing code
    // is using it incorrectly.
    function checkStoreIndexes (testCase, store, errorMessage) {
      assert_array_equals(
          store.indexNames, ['by_author', 'by_title'], errorMessage);
      const authorIndex = store.index('by_author');
      const titleIndex = store.index('by_title');
      return Promise.all([
          checkAuthorIndexContents(testCase, authorIndex, errorMessage),
          checkTitleIndexContents(testCase, titleIndex, errorMessage),
      ]);
    }
    globalize(checkStoreIndexes)

    // Verifies that an object store's key generator is in the same state as the
    // key generator created for the books store in the test database's version 1.
    //
    // The errorMessage is used if the assertions fail. It can state that the
    // IndexedDB implementation being tested is incorrect, or that the testing code
    // is using it incorrectly.
    function checkStoreGenerator(testCase, store, expectedKey, errorMessage) {
      const request = store.put(
          { author: 'Barney', title: `Bedrock Nights ${expectedKey}` });
      return promiseForRequest(testCase, request).then(result => {
        assert_equals(result, expectedKey, errorMessage);
      });
    }
    globalize(checkStoreGenerator)

    // Verifies that an object store's contents matches the contents used to create
    // the books store in the test database's version 1.
    //
    // The errorMessage is used if the assertions fail. It can state that the
    // IndexedDB implementation being tested is incorrect, or that the testing code
    // is using it incorrectly.
    function checkStoreContents(testCase, store, errorMessage) {
      const request = store.get(123_456);
      return promiseForRequest(testCase, request).then(result => {
        assert_equals(result.isbn, BOOKS_RECORD_DATA[0].isbn, errorMessage);
        assert_equals(result.author, BOOKS_RECORD_DATA[0].author, errorMessage);
        assert_equals(result.title, BOOKS_RECORD_DATA[0].title, errorMessage);
      });
    }
    globalize(checkStoreContents)

    // Verifies that index matches the 'by_author' index used to create the
    // by_author books store in the test database's version 1.
    //
    // The errorMessage is used if the assertions fail. It can state that the
    // IndexedDB implementation being tested is incorrect, or that the testing code
    // is using it incorrectly.
    function checkAuthorIndexContents(testCase, index, errorMessage) {
      const request = index.get(BOOKS_RECORD_DATA[2].author);
      return promiseForRequest(testCase, request).then(result => {
        assert_equals(result.isbn, BOOKS_RECORD_DATA[2].isbn, errorMessage);
        assert_equals(result.title, BOOKS_RECORD_DATA[2].title, errorMessage);
      });
    }
    globalize(checkAuthorIndexContents)

    // Verifies that an index matches the 'by_title' index used to create the books
    // store in the test database's version 1.
    //
    // The errorMessage is used if the assertions fail. It can state that the
    // IndexedDB implementation being tested is incorrect, or that the testing code
    // is using it incorrectly.
    function checkTitleIndexContents(testCase, index, errorMessage) {
      const request = index.get(BOOKS_RECORD_DATA[2].title);
      return promiseForRequest(testCase, request).then(result => {
        assert_equals(result.isbn, BOOKS_RECORD_DATA[2].isbn, errorMessage);
        assert_equals(result.author, BOOKS_RECORD_DATA[2].author, errorMessage);
      });
    }
    globalize(checkTitleIndexContents)

    // Returns an Uint8Array with pseudorandom data.
    //
    // The PRNG should be sufficient to defeat compression schemes, but it is not
    // cryptographically strong.
    function largeValue(size, seed) {
      const buffer = new Uint8Array(size);

      // 32-bit xorshift - the seed can't be zero
      let state = 1000 + seed;

      for (let i = 0; i < size; ++i) {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        buffer[i] = state & 0xFF;
      }

      return buffer;
    }

    async function _deleteAllDatabases(_testCase) {
      const dbs_to_delete = await indexedDB.databases();
      for( const db_info of dbs_to_delete) {
        const request = indexedDB.deleteDatabase(db_info.name);
        const eventWatcher = requestWatcher(_testCase, request);
        await eventWatcher.wait_for('success');
      }
    }

    // Keeps the passed transaction alive indefinitely (by making requests
    // against the named store). Returns a function that asserts that the
    // transaction has not already completed and then ends the request loop so that
    // the transaction may autocommit and complete.
    function _keepAlive(_testCase, transaction, storeName) {
      let completed = false;
      transaction.addEventListener('complete', () => { completed = true; });

      let keepSpinning = true;

      function spin() {
        if (!keepSpinning)
          {return;}
        transaction.objectStore(storeName).get(0).onsuccess = spin;
      }
      spin();

      return testCase.step_func(() => {
        assert_false(completed, 'Transaction completed while kept alive');
        keepSpinning = false;
      });
    }

    // Return a promise that resolves after a setTimeout finishes to break up the
    // scope of a function's execution.
    function _timeoutPromise(_ms) {
      return new Promise(resolve => { setTimeout(resolve, _ms); });
    }
    // Migrates an IndexedDB database whose name is unique for the test case.
    //
    // newVersion must be greater than the database's current version.
    //
    // migrationCallback will be called during a versionchange transaction and will
    // given the created database, the versionchange transaction, and the database
    // open request.
    //
    // Returns a promise. If the versionchange transaction goes through, the promise
    // resolves to an IndexedDB database that should be closed by the caller. If the
    // versionchange transaction is aborted, the promise resolves to an error.
    function migrateDatabase(testCase, newVersion, migrationCallback) {
      return migrateNamedDatabase(
          testCase, databaseName(testCase), newVersion, migrationCallback);
    }
    globalize(migrateDatabase)

    // Migrates an IndexedDB database.
    //
    // newVersion must be greater than the database's current version.
    //
    // migrationCallback will be called during a versionchange transaction and will
    // given the created database, the versionchange transaction, and the database
    // open request.
    //
    // Returns a promise. If the versionchange transaction goes through, the promise
    // resolves to an IndexedDB database that should be closed by the caller. If the
    // versionchange transaction is aborted, the promise resolves to an error.
    async function migrateNamedDatabase(
        testCase, databaseName, newVersion, migrationCallback) {
      // We cannot use eventWatcher.wait_for('upgradeneeded') here, because
      // the versionchange transaction auto-commits before the Promise's then
      // callback gets called.
      const databaseOrError = await new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, newVersion)
        request.onupgradeneeded = testCase.step_func(event => {
          const database = event.target.result
          const transaction = event.target.transaction
          let shouldBeAborted = false
          let requestEventPromise = null

          // We wrap IDBTransaction.abort so we can set up the correct event
          // listeners and expectations if the test chooses to abort the
          // versionchange transaction.
          const transactionAbort = transaction.abort.bind(transaction)
          transaction.abort = () => {
            transaction._willBeAborted()
            transactionAbort()
          }
          transaction._willBeAborted = () => {
            requestEventPromise = new Promise((resolve_1, reject_1) => {
              request.onerror = event_1 => {
                event_1.preventDefault()
                resolve_1(event_1.target.error)
              }
              request.onsuccess = () => reject_1(new Error(
                'indexedDB.open should not succeed for an aborted ' +
                'versionchange transaction'))
            })
            shouldBeAborted = true
          }

          // If migration callback returns a promise, we'll wait for it to resolve.
          // This simplifies some tests.
          const callbackResult = migrationCallback(database, transaction, request)
          if (!shouldBeAborted) {
            request.onerror = null
            request.onsuccess = null
            requestEventPromise = promiseForRequest(testCase, request)
          }

          // requestEventPromise needs to be the last promise in the chain, because
          // we want the event that it resolves to.
          resolve(Promise.resolve(callbackResult).then(() => requestEventPromise))
        })
        request.onerror = event_2 => reject(event_2.target.error)
        request.onsuccess = () => {
          const database_1 = request.result
          testCase.add_cleanup(() => { database_1.close() })
          reject(new Error(
            'indexedDB.open should not succeed without creating a ' +
            'versionchange transaction'))
        }
      })
      if (databaseOrError instanceof IDBDatabase)
        {testCase.add_cleanup(() => { databaseOrError.close() })}
      return databaseOrError
    }

    // Creates a 'not_books' object store used to test renaming into existing or
    // deleted store names.
    function createNotBooksStore(database) {
      const store = database.createObjectStore('not_books');
      store.createIndex('not_by_author', 'author');
      store.createIndex('not_by_title', 'title', { unique: true });
      return store;
    }
    globalize(createNotBooksStore)
    // Keeps the passed transaction alive indefinitely (by making requests
    // against the named store). Returns a function that asserts that the
    // transaction has not already completed and then ends the request loop so that
    // the transaction may autocommit and complete.
    function keep_alive(tx, store_name) {
      let completed = false;
      tx.addEventListener('complete', () => { completed = true; });

      let keepSpinning = true;

      function spin() {
        if (!keepSpinning)
          {return;}
        tx.objectStore(store_name).get(0).onsuccess = spin;
      }
      spin();

      return () => {
        assert_false(completed, 'Transaction completed while kept alive');
        keepSpinning = false;
      };
    }
    globalize(keep_alive)
    // Checks to see if the passed transaction is active (by making
    // requests against the named store).
    function is_transaction_active(tx, store_name) {
      try {
        const request = tx.objectStore(store_name).get(0);
        request.onerror = e => {
          e.preventDefault();
          e.stopPropagation();
        };
        return true;
      } catch (error) {
        assert_equals(error.name, 'TransactionInactiveError',
                      'Active check should either not throw anything, or throw ' +
                      'TransactionInactiveError');
        return false;
      }
    }
    globalize(is_transaction_active)

    // Promise that resolves when an IDBTransaction completes.
    //
    // The promise resolves with undefined if IDBTransaction receives the "complete"
    // event, and rejects with an error for any other event.
    function promiseForTransaction(testCase, request) {
      const eventWatcher = transactionWatcher(testCase, request);
      return eventWatcher.wait_for('complete').then(() => {});
    }
    globalize(promiseForTransaction)


    // Returns a new function. After it is called |count| times, |func|
    // will be called.
    function barrier_func(count, func) {
      let n = 0;
      return () => {
        if (++n === count)
          {func();}
      };
    }
    globalize(barrier_func)
    function createdb_for_multiple_tests(dbname, version) {
        var rq_open,
            test = null;
        
        dbname = dbname || `testdb-${Date.now()}-${Math.random()}`;

        if (version)
            {rq_open = indexedDB.open(dbname, version);}
        else
            {rq_open = indexedDB.open(dbname);}

        function auto_fail(evt, current_test) {
            /* Fail handlers, if we haven't set on/whatever/, don't
             * expect to get event whatever. */
            rq_open.manually_handled = {};

            rq_open.addEventListener(evt, (e) => {
                if (current_test !== test) {
                    return;
                }

                test.step(function exports() {
                    if (!rq_open.manually_handled[evt]) {
                        assert_unreached(`unexpected open.${evt} event`);
                    }

                    if (`${e.target.result}` === '[object IDBDatabase]' &&
                        !this?.db) {
                      this.db = e.target.result;

                      this.db.onerror = fail(test, 'unexpected db.error');
                      this.db.onabort = fail(test, 'unexpected db.abort');
                      this.db.onversionchange =
                          fail(test, 'unexpected db.versionchange');
                    }
                });
            });
            rq_open.__defineSetter__(`on${evt}`, (h) => {
                rq_open.manually_handled[evt] = true;
                if (!h)
                    {rq_open.addEventListener(evt, () => {});}
                else
                    {rq_open.addEventListener(evt, test.step_func(h));}
            });
        }

        // add a .setTest method to the IDBOpenDBRequest object
        Object.defineProperty(rq_open, 'setTest', {
            enumerable: false,
            value: (t) => {
                test = t;

                auto_fail('upgradeneeded', test);
                auto_fail('success', test);
                auto_fail('blocked', test);
                auto_fail('error', test);

                return this;
            }
        });

        return rq_open;
    }
    globalize(createdb_for_multiple_tests)

    // Should be large enough to trigger large value handling in the IndexedDB
    // engines that have special code paths for large values.
    const wrapThreshold = 128 * 1024;
    globalize(wrapThreshold, 'wrapThreshold')

    // Returns an IndexedDB value created from a descriptor.
    //
    // See the bottom of the file for descriptor samples.
    function createValue(descriptor) {
      if (typeof(descriptor) !== 'object')
        {return descriptor;}

      if (Array.isArray(descriptor))
        {return descriptor.map((element) => createValue(element));}

      if (!Object.hasOwn(descriptor, 'type')) {
        const value = {};
        for (const property of Object.getOwnPropertyNames(descriptor))
          {value[property] = createValue(descriptor[property]);}
        return value;
      }

      switch (descriptor.type) {
        case 'blob': {
          return new Blob(
              [largeValue(descriptor.size, descriptor.seed)],
              { type: descriptor.mimeType });
        }
        case 'buffer': {
          return largeValue(descriptor.size, descriptor.seed);
        }
      }
    }

    // Checks an IndexedDB value against a descriptor.
    //
    // Returns a Promise that resolves if the value passes the check.
    //
    // See the bottom of the file for descriptor samples.
    function checkValue(testCase, value, descriptor) {
      if (typeof(descriptor) !== 'object') {
        assert_equals(
            descriptor, value,
            'IndexedDB result should match put() argument');
        return Promise.resolve();
      }

      if (Array.isArray(descriptor)) {
        assert_true(
            Array.isArray(value),
            'IndexedDB result type should match put() argument');
        assert_equals(
            descriptor.length, value.length,
            'IndexedDB result array size should match put() argument');

        const subChecks = [];
        for (let i = 0; i < descriptor.length; ++i)
          {subChecks.push(checkValue(testCase, value[i], descriptor[i]));}
        return Promise.all(subChecks);
      }

      if (!Object.hasOwn(descriptor, 'type')) {
        assert_array_equals(
            Object.getOwnPropertyNames(value).toSorted(),
            Object.getOwnPropertyNames(descriptor).toSorted(),
            'IndexedDB result object properties should match put() argument');
        return Promise.all(Object.getOwnPropertyNames(descriptor).map(property =>
            checkValue(testCase, value[property], descriptor[property])));
      }

      switch (descriptor.type) {
        case 'blob': {
          assert_class_string(
              value, 'Blob',
              'IndexedDB result class should match put() argument');
          assert_equals(
              descriptor.mimeType, value.type,
              'IndexedDB result Blob MIME type should match put() argument');
          assert_equals(descriptor.size, value.size, 'incorrect Blob size');
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = testCase.step_func(() => {
              if (reader.error) {
                reject(reader.error);
                return;
              }
              const view = new Uint8Array(reader.result);
              assert_equals(
                  view.join(','),
                  largeValue(descriptor.size, descriptor.seed).join(','),
                  'IndexedDB result Blob content should match put() argument');
              resolve();
            });
            reader.readAsArrayBuffer(value);
          });
        }

        case 'buffer': {
          assert_class_string(
              value, 'Uint8Array',
              'IndexedDB result type should match put() argument');
          assert_equals(
              value.join(','),
              largeValue(descriptor.size, descriptor.seed).join(','),
              'IndexedDB result typed array content should match put() argument');
          return Promise.resolve();
        }
      }
    }

    function cloningTestInternal(label, valueDescriptors, options) {
      promise_test(testCase => {
        return createDatabase(testCase, (database) => {
          let store;
          if (options.useKeyGenerator) {
            store = database.createObjectStore(
                'test-store', { autoIncrement: true, keyPath: 'primaryKey' });
          } else {
            store = database.createObjectStore('test-store');
          }
          for (let i = 0; i < valueDescriptors.length; ++i) {
            if (options.useKeyGenerator) {
              store.put(createValue(valueDescriptors[i]));
            } else {
              store.put(createValue(valueDescriptors[i]), i + 1);
            }
          }
        }).then(database => {
          const transaction = database.transaction(['test-store'], 'readonly');
          const store = transaction.objectStore('test-store');
          const subChecks = [];
          let resultIndex = 0;
          for (let i = 0; i < valueDescriptors.length; ++i) {
            subChecks.push(new Promise((resolve, reject) => {
              const requestIndex = i;
              const primaryKey = requestIndex + 1;
              const request = store.get(primaryKey);
              request.onerror =
                  testCase.step_func(() => { reject(request.error); });
              request.onsuccess = testCase.step_func(() => {
                assert_equals(
                    resultIndex, requestIndex,
                    'IDBRequest success events should be fired in request order');
                ++resultIndex;

                const result = request.result;
                if (options.useKeyGenerator) {
                  assert_equals(
                      result.primaryKey, primaryKey,
                      'IndexedDB result should have auto-incremented primary key');
                  delete result.primaryKey;
                }
                resolve(checkValue(
                    testCase, result, valueDescriptors[requestIndex]));
              });
            }));
          }

          subChecks.push(new Promise((resolve, reject) => {
            const requestIndex = valueDescriptors.length;
            const request = store.getAll();
            request.onerror =
                testCase.step_func(() => { reject(request.error); });
            request.onsuccess = testCase.step_func(() => {
              assert_equals(
                  resultIndex, requestIndex,
                  'IDBRequest success events should be fired in request order');
              ++resultIndex;
              const result = request.result;
              if (options.useKeyGenerator) {
                for (let i = 0; i < valueDescriptors.length; ++i) {
                  const primaryKey = i + 1;
                  assert_equals(
                      result[i].primaryKey, primaryKey,
                      'IndexedDB result should have auto-incremented primary key');
                  delete result[i].primaryKey;
                }
              }
              resolve(checkValue(testCase, result, valueDescriptors));
            });
          }));

          return Promise.all(subChecks);
        });
      }, label);
    }

    // Performs a series of put()s and verifies that get()s and getAll() match.
    //
    // Each element of the valueDescriptors array is fed into createValue(), and the
    // resulting value is written to IndexedDB via a put() request. After the writes
    // complete, the values are read in the same order in which they were written.
    // Last, all the results are read one more time via a getAll().
    //
    // The test verifies that the get() / getAll() results match the arguments to
    // put() and that the order in which the get() result events are fired matches
    // the order of the get() requests.
    function cloningTest(label, valueDescriptors) {
      cloningTestInternal(label, valueDescriptors, { useKeyGenerator: false });
    }
    globalize(cloningTest)

    // cloningTest, with coverage for key generators.
    //
    // This creates two tests. One test performs a series of put()s and verifies
    // that get()s and getAll() match, exactly like cloningTestWithoutKeyGenerator.
    // The other test performs the same put()s in an object store with a key
    // generator, and checks that the key generator works properly.
    function cloningTestWithKeyGenerator(label, valueDescriptors) {
      cloningTestInternal(label, valueDescriptors, { useKeyGenerator: false });
      cloningTestInternal(
          `${label} with key generator`, valueDescriptors,
          { useKeyGenerator: true });
    }
    globalize(cloningTestWithKeyGenerator)

    return futures
}
