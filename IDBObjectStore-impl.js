import extractor from './extractor'
import { vivify } from './setter'
import { valuify } from './value'
import assert from 'node:assert'
import convert from './convert'
import { IDBRequest } from './living/generated/IDBRequest'
import { IDBIndex } from './living/generated/IDBIndex'
import { IDBKeyRange } from './living/generated/IDBKeyRange'
import { IDBCursor } from './living/generated/IDBCursor'
import { IDBCursorWithValue } from './living/generated/IDBCursorWithValue'
import { DOMStringList } from './living/generated/DOMStringList'
import { DOMException } from 'node:domexception/lib/DOMException'
import { webidl } from './living/generated/utils'
import structuredClone from './structuredClone'

// Not sure if IndexedDB API expects the same object store returned from every
// transaction, no idea how that would work, so this isn't an object that
// implements a store, it is an object that is an interface to a store for a
// specific transaction.

class IDBObjectStoreImpl {
    // The loop is the event loop for the transaction associated with this
    // object store, we push messages with a request object. The work is
    // performed by the loop object. The loop object is run after the locking is
    // performed.
    constructor (globalObject, _args, { transaction, schema, name, constructing = false }) {
        assert.ok(schema, 'schema is null')
        this._globalObject = globalObject
        assert.ok(typeof transaction === 'object')
        this._transaction = transaction
        this._schema = schema
        this._store = this._schema.getObjectStore(name)
        this.keyPath = JSON.parse(JSON.stringify(this._store.keyPath))
        this.autoIncrement = this._store.autoIncrement !== null
        this._constructing = constructing
    }

    // Common `isDeleted` interface for inspection from an outstanding cursor.
    _isDeleted () {
        return this._schema.isDeleted(this._store)
    }

    get transaction () {
        return webidl.wrapperForImpl(this._transaction)
    }

    set name (to) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction.mode !== 'versionchange') {
            throw DOMException.create(this._globalObject, [ 'The object store name can only be changed during a versionchange transaction.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (this._store.name !== to) {
            if (this._schema.getObjectStore(to) !== null) {
                throw DOMException.create(this._globalObject, [ `An object store with the name "${to}" already exists.`, 'ConstraintError' ], {})
            }
            const from = this._store.name
            this._schema.rename(from, to)
            this._transaction._queue.push({
                method: 'rename', store: JSON.parse(JSON.stringify(this._store)), type: 'store'
            })
        }
    }

    get name () {
        return this._store.name
    }

    get indexNames () {
        return DOMStringList.create(this._globalObject, [], { array: this._schema.getIndexNames(this._store.name) })
    }

    _addOrPut (value, key, overwrite) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (this._transaction.mode === 'readonly') {
            throw DOMException.create(this._globalObject, [ 'The transaction is in readonly mode. Cannot write to a readonly transaction.', 'ReadOnlyError' ], {})
        }
        if (key !== null && this._store.keyPath !== null) {
            throw DOMException.create(this._globalObject, [ 'The object store uses a key path and no separate key should be provided.', 'DataError' ], {})
        }
        if (key === null && this._store.autoIncrement === null && this._store.keyPath === null) {
            throw DOMException.create(this._globalObject, [ 'The object store requires a key, but none was provided.', 'DataError' ], {})
        }
        try {
            this._transaction._state = 'inactive'
            value = structuredClone(this._globalObject, value)
        } finally {
            this._transaction._state = 'active'
        }
        if (this._store.keyPath !== null) {
            key = this._schema.getExtractor(this._store.id)(value)
        }
        if (this._store.autoIncrement !== null) {
            if (key === null) {
                key = this._store.autoIncrement++
                if (this._store.keyPath !== null) {
                    vivify(this._globalObject, value, this._store.keyPath, key)
                }
            } else {
                key = valuify(this._globalObject, key)
                if (typeof key === 'number' && key >= this._store.autoIncrement) {
                    this._store.autoIncrement = Math.floor(key + 1)
                }
            }
        } else {
            key = valuify(this._globalObject, key)
        }
        const request = IDBRequest.createImpl(this._globalObject, [], { source: this, transaction: this._transaction })
        this._transaction._queue.push({
            key, method: 'set', overwrite, request, store: JSON.parse(JSON.stringify(this._store)), value
        })
        return request
    }

    put (value, key = null) {
        return this._addOrPut(value, key, true)
    }

    add (value, key = null) {
        return this._addOrPut(value, key, false)
    }

    delete (query) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (this._transaction.mode === 'readonly') {
            throw DOMException.create(this._globalObject, [ 'The transaction is in readonly mode. Cannot delete from a readonly transaction.', 'ReadOnlyError' ], {})
        }
        if (query !== null && ! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(convert.key(this._globalObject, query))
        }
        const request = IDBRequest.createImpl(this._globalObject, [], {
            // **TODO** parent is always transaction, so...
            source: this, transaction: this._transaction
        })
        this._transaction._queue.push({
            method: 'delete', query, request, store: JSON.parse(JSON.stringify(this._store))
        })
        return request
    }

    clear () {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (this._transaction.mode === 'readonly') {
            throw DOMException.create(this._globalObject, [ 'The transaction is in readonly mode. Cannot clear a readonly transaction.', 'ReadOnlyError' ], {})
        }
        const request = IDBRequest.createImpl(this._globalObject, [], { source: this, transaction: this._transaction })
        this._transaction._queue.push({
            method: 'clear',
            request: request,
            store: JSON.parse(JSON.stringify(this._store))
        })
        return request
    }

    _get (query, keys) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (query === null) {
            throw DOMException.create(this._globalObject, [ 'The query parameter cannot be null.', 'DataError' ], {})
        }
        if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(convert.key(this._globalObject, query))
        }
        const request = IDBRequest.createImpl(this._globalObject, [], { source: this, transaction: this._transaction })
        this._transaction._queue.push({
            keys: keys, method: 'get', query: query, request: request, store: JSON.parse(JSON.stringify(this._store)), type: 'store'
        })
        return request
    }

    get (query) {
        return this._get(query, false)
    }

    getKey (query) {
        return this._get(query, true)
    }

    _getAll(query, count, keys) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (query === null) {
            query = IDBKeyRange.createImpl(this._globalObject, [ null, null ], {})
        } else if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(convert.key(this._globalObject, query))
        }
        const request = IDBRequest.createImpl(this._globalObject, [], { source: this, transaction: this._transaction })
        this._transaction._queue.push({
            count: count, keys: keys, method: 'getAll', query: query, request: request, store: JSON.parse(JSON.stringify(this._store)), type: 'store'
        })
        return request
    }

    getAll (query, count = 0) {
        return this._getAll(query, count, false)
    }

    getAllKeys (query, count = null) {
        return this._getAll(query, count, true)
    }

    count (query) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (query === null) {
            query = IDBKeyRange.createImpl(this._globalObject, [ null, null ], {})
        } else if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(convert.key(this._globalObject, query))
        }
        const request = IDBRequest.createImpl(this._globalObject, [], { source: this, transaction: this._transaction })
        this._transaction._queue.push({
            method: 'count', query: query, request: request, store: JSON.parse(JSON.stringify(this._store)), type: 'store'
        })
        return request
    }

    _openCursor (Cursor, query, direction) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (query === null) {
            query = IDBKeyRange.createImpl(this._globalObject, [ null, null ], {})
        } else if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(convert.key(this._globalObject, query))
        }
        const request = IDBRequest.createImpl(this._globalObject, [], { source: this, transaction: this._transaction })
        const cursor = Cursor.createImpl(this._globalObject, [], {
            direction: direction, query: query, request: request, source: this, store: this._store, transaction: this._transaction, type: 'store'
        })
        request._result = webidl.wrapperForImpl(cursor)
        this._transaction._queue.push({
            cursor: cursor, direction: direction, method: 'openCursor', query: query, request: request, store: JSON.parse(JSON.stringify(this._store)), type: 'store'
        })
        return request
    }

    openCursor (query, direction = 'next') {
        return this._openCursor(IDBCursorWithValue, query, direction)
    }

    openKeyCursor (query, direction = 'next') {
        return this._openCursor(IDBCursor, query, direction)
    }

    index (name) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state === 'finished') {
            throw DOMException.create(this._globalObject, [ 'The transaction has finished. Cannot access indexes from a finished transaction.', 'InvalidStateError' ], {})
        }
        const index = this._schema.getIndex(this._store.name, name)
        if (index === null) {
            throw DOMException.create(this._globalObject, [ `The index "${name}" was not found in the object store "${this._store.name}".`, 'NotFoundError' ], {})
        }
        return IDBIndex.create(this._globalObject, [], {
            index: index, objectStore: this, schema: this._schema, store: JSON.parse(JSON.stringify(this._store)), transaction: this._transaction
        })
    }

    createIndex (name, keyPath, { unique = false, multiEntry = false } = {}) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction.mode !== 'versionchange') {
            throw DOMException.create(this._globalObject, [ 'Indexes can only be created during a versionchange transaction.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        if (this._store.index[name] !== null) {
            throw DOMException.create(this._globalObject, [ `An index with the name "${name}" already exists in the object store "${this._store.name}".`, 'ConstraintError' ], {})
        }
        extractor.verify(this._globalObject, keyPath)
        // **TODO** If keyPath is not a valid key path, throw a "SyntaxError" DOMException.
        if (Array.isArray(keyPath) && multiEntry) {
            throw DOMException.create(this._globalObject, [ 'The multiEntry option cannot be used with an array keyPath.', 'InvalidAccessError' ], {})
        }
        const index = this._schema.createIndex(this._store.name, name, keyPath, multiEntry, unique)
        this._transaction._queue.push({
            index: index, method: 'create', store: JSON.parse(JSON.stringify(this._store)), type: 'index'
        })
        return IDBIndex.create(this._globalObject, [], { index: index, objectStore: this })
    }

    deleteIndex (name) {
        if (this._isDeleted()) {
            throw DOMException.create(this._globalObject, [ 'The object store has been deleted.', 'InvalidStateError' ], {})
        }
        if (this._transaction.mode !== 'versionchange') {
            throw DOMException.create(this._globalObject, [ 'Indexes can only be deleted during a versionchange transaction.', 'InvalidStateError' ], {})
        }
        if (this._transaction._state !== 'active') {
            throw DOMException.create(this._globalObject, [ 'The transaction is not active.', 'TransactionInactiveError' ], {})
        }
        const index = this._schema.getIndex(this._store.name, name)
        if (index === null) {
            throw DOMException.create(this._globalObject, [ `The index "${name}" was not found in the object store "${this._store.name}".`, 'NotFoundError' ], {})
        }
        this._schema.deleteIndex(this._store.name, index.name)
        this._transaction._queue.push({
            index: index, method: 'destroy', store: JSON.parse(JSON.stringify(this._store))
        })
    }
}

module.exports = { implementation: IDBObjectStoreImpl }
