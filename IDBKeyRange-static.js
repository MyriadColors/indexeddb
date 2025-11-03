import { IDBKeyRange } from './living/generated/IDBKeyRange'

const { valuify } = require('./value')

exports.patch = (globalObject) => {
    globalObject.IDBKeyRange.bound = (lower, upper, lowerOpen = false, upperOpen = false) => IDBKeyRange.create(globalObject, [ valuify(globalObject, lower), valuify(globalObject, upper), lowerOpen, upperOpen ], {})
    globalObject.IDBKeyRange.upperBound = (upper, open = false) => IDBKeyRange.create(globalObject, [ undefined, valuify(globalObject, upper), true, open ], {})
    globalObject.IDBKeyRange.lowerBound = (lower, open = false) => IDBKeyRange.create(globalObject, [ valuify(globalObject, lower), undefined, open, true ], {})
    globalObject.IDBKeyRange.only = (only) => globalObject.IDBKeyRange.bound(only, only)
}
