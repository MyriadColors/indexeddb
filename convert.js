const DOMException = require('domexception/lib/DOMException')

export function key (globalObject, value, path = []) {
    switch (typeof value) {
    case 'number': {
            if (Number.isNaN(value)) {
                throw DOMException.create(globalObject, [ 'Invalid key: NaN values are not allowed as IndexedDB keys', 'DataError' ], {})
            }
            return value
        }
    case 'string': {
            return value
        }
    case 'object': {
            if (value instanceof Date) {
                if (Number.isNaN(value.getTime())) {
                    throw DOMException.create(globalObject, [ 'Invalid key: Invalid date values (NaN) are not allowed as IndexedDB keys', 'DataError' ], {})
                }
                return value
            } else if (Array.isArray(value)) {
                const keys = [], subPath = path.concat(value)
                for (let i = 0, I = value.length; i < I; i++) {
                    if (! Object.hasOwn(value, i)) {
                        throw DOMException.create(globalObject, [ 'Invalid key: Sparse arrays are not allowed as IndexedDB keys (all array indices must be present)', 'DataError' ], {})
                    }
                    if (~path.indexOf(value[i])) {
                        throw DOMException.create(globalObject, [ 'Invalid key: Circular references are not allowed in IndexedDB key arrays', 'DataError' ], {})
                    }
                    keys.push(key(globalObject, value[i], subPath))
                }
                return keys
            }
            throw DOMException.create(globalObject, [ 'Invalid key: Object type is not supported as IndexedDB key (only number, string, Date, and arrays of these types are allowed)', 'DataError' ], {})
        }
    default: {
            throw DOMException.create(globalObject, [ 'Invalid key: Type is not supported as IndexedDB key', 'DataError' ], {})
        }
    }
}
