import { createImpl } from './living/generated/IDBRequest'
import { createImpl as _createImpl } from './living/generated/IDBKeyRange'
import { create } from 'domexception/lib/DOMException'
import IDBCursor from './living/generated/IDBCursor'
import IDBCursorWithValue from './living/generated/IDBCursorWithValue'

import { wrapperForImpl } from './living/generated/utils'
import { key as _key } from './convert'

class IDBIndexImpl {
    // TODO Make loop a property of transaction.
    constructor (globalObject, _args, { index, objectStore }) {
        this._globalObject = globalObject
        this._index = index
        // Different instances of index need different instances of keyPath, but
        // keyPath must be the same each time the accessor is called.
        this.keyPath = JSON.parse(JSON.stringify(this._index.keyPath))
        this.objectStore = objectStore
    }

    // Common `isDeleted` interface for inspection from an outstanding cursor.
    _isDeleted () {
        return this.objectStore._schema.isDeleted(this._index)
    }

    get name () {
        return this._index.name
    }

    set name (to) {
        if (this._isDeleted()) {
            throw create(this._globalObject, [ 'TODO: message', 'InvalidStateError' ], {})
        }
        if (this.objectStore._transaction.mode !== 'versionchange') {
            throw create(this._globalObject, [ 'TODO: message', 'InvalidStateError' ], {})
        }
        if (this.objectStore._transaction._state !== 'active') {
            throw create(this._globalObject, [ 'TODO: message', 'TransactionInactiveError' ], {})
        }
        if (this._index.name !== to) {
            if (to in this.objectStore._store.index) {
                throw create(this._globalObject, [ 'TODO: message', 'ConstraintError' ], {})
            }
            this.objectStore._schema.renameIndex(this.objectStore._store.id, this._index.name, to)
            this.objectStore._transaction._queue.push({
                index: JSON.parse(JSON.stringify(this._index)), method: 'rename', store: JSON.parse(JSON.stringify(this.objectStore._store)), type: 'index'
            })
        }
    }

    get multiEntry () {
        return this._index.multiEntry
    }

    get unique () {
        return this._index.unique
    }

    _get (query, key) {
        if (this._isDeleted()) {
            throw create(this._globalObject, [ 'TODO: message', 'InvalidStateError' ], {})
        }
        if (this.objectStore._transaction._state !== 'active') {
            throw create(this._globalObject, [ 'TODO: message', 'TransactionInactiveError' ], {})
        }
        if (query == null) {
            query = _createImpl(this._globalObject, [ null, null ], {})
        } else if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(_key(this._globalObject, query))
        }
        const request = createImpl(this._globalObject, [], { source: this, transaction: this.objectStore._transaction })
        this.objectStore._transaction._queue.push({
            index: this._index, key: key, method: 'get', query: query, request: request, store: this.objectStore._store, type: 'index'
        })
        return request
    }

    get (query) {
        return this._get(query, false)
    }

    getKey (query) {
        return this._get(query, true)
    }

    _getAll (query, count, keys) {
        if (this._isDeleted()) {
            throw create(this._globalObject, [ 'TODO: message', 'InvalidStateError' ], {})
        }
        if (this.objectStore._transaction._state !== 'active') {
            throw create(this._globalObject, [ 'TODO: message', 'TransactionInactiveError' ], {})
        }
        if (query == null) {
            query = _createImpl(this._globalObject, [ null, null ], {})
        } else if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(_key(this._globalObject, query))
        }
        const request = createImpl(this._globalObject, {}, { source: this, transaction: this.objectStore._transaction })
        this.objectStore._transaction._queue.push({
            count: count, index: this._index, keys: keys, method: 'getAll', query: query, request: request, store: JSON.parse(JSON.stringify(this.objectStore._store)), type: 'index'
        })
        return request
    }

    getAll (query, count = null) {
        return this._getAll(query, count, false)
    }

    getAllKeys (query, count = null) {
        return this._getAll(query, count, true)
    }

    count (query) {
        if (this._isDeleted()) {
            throw create(this._globalObject, [ 'TODO: message', 'InvalidStateError' ], {})
        }
        if (this.objectStore._transaction._state !== 'active') {
            throw create(this._globalObject, [ 'TODO: message', 'TransactionInactiveError' ], {})
        }
        if (query == null) {
            query = _createImpl(this._globalObject, [ null, null ], {})
        } else if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(_key(this._globalObject, query))
        }
        const request = createImpl(this._globalObject, [], { source: this, transaction: this.objectStore._transaction })
        this.objectStore._transaction._queue.push({
            index: this._index, method: 'count', query: query, request: request, store: JSON.parse(JSON.stringify(this.objectStore._store)), type: 'index'
        })
        return request
    }

    _openCursor (Cursor, query, direction = 'next') {
        if (this._isDeleted()) {
            throw create(this._globalObject, [ 'TODO: message', 'InvalidStateError' ], {})
        }
        if (this.objectStore._transaction._state !== 'active') {
            throw create(this._globalObject, [ 'TODO: message', 'TransactionInactiveError' ], {})
        }
        if (query == null) {
            query = _createImpl(this._globalObject, [ null, null ], {})
        } else if (! (query instanceof this._globalObject.IDBKeyRange)) {
            query = this._globalObject.IDBKeyRange.only(_key(this._globalObject, query))
        }
        const request = createImpl(this._globalObject, [], {
            source: this,
            transaction: this.objectStore._transaction
        })
        const cursor = Cursor.createImpl(this._globalObject, [], {
            direction: direction, hello: 'world', index: this._index, query: query, request: request, source: this, store: this.objectStore._store, transaction: this.objectStore._transaction, type: 'index'
        })
        request._result = wrapperForImpl(cursor)
        this.objectStore._transaction._queue.push({
            cursor: cursor, direction: direction, index: this._index, method: 'openCursor', query: query, request: request, source: this, store: JSON.parse(JSON.stringify(this.objectStore._store)), type: 'index'
        })
        return request
    }

    openCursor (query, direction = 'next') {
        return this._openCursor(IDBCursorWithValue, query, direction)
    }

    openKeyCursor (query, direction = 'next') {
        return this._openCursor(IDBCursor, query, direction)
    }
}

export const implementation = IDBIndexImpl
