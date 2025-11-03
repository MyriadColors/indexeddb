const DOMException = require('domexception/lib/DOMException')

export const MAX = Symbol('MAX')

// https://w3c.github.io/IndexedDB/#convert-a-value-to-a-input
function valuify (globalObject, value, seen = new Set) {
    switch (typeof value) {
    case 'number':
        if (Number.isNaN(value)) {
            throw DOMException.create(globalObject, [ 'Invalid number: NaN values are not allowed in IndexedDB', 'DataError' ], {})
        }
        return value
    case 'string':
        return value
    case 'object':
        if (value instanceof Date) {
            if (Number.isNaN(value.valueOf())) {
                throw DOMException.create(globalObject, [ 'Invalid Date: Invalid date values (NaN) are not allowed in IndexedDB', 'DataError' ], {})
            }
            return value
        } else if (value instanceof ArrayBuffer) {
            return new Uint8Array(value).buffer
        } else if (ArrayBuffer.isView(value)) {
            return value.buffer
        } else if (Array.isArray(value)) {
            if (util.types.isProxy(value)) {
                throw DOMException.create(globalObject, [ 'Invalid value: Proxy objects cannot be stored in IndexedDB', 'DataError' ], {})
            }
            const converted = []
            seen.add(value)
            // TODO This is getting slow.
            // TODO Not exactly like descriptions I don't think.
            for (let i = 0, I = value.length; i < I; i++) {
                const x = value[i]
                if (seen.has(x)) {
                    throw DOMException.create(globalObject, [ 'Invalid value: Circular references are not allowed in IndexedDB', 'DataError' ], {})
                }
                Object.defineProperty(converted, i, { value: valuify(globalObject, x, seen) })
            }
            return converted
        } else {
            throw DOMException.create(globalObject, [ 'Invalid value: Object type is not supported in IndexedDB (only Date, ArrayBuffer, typed arrays, and plain arrays are allowed)', 'DataError' ], {})
        }
    case 'symbol':
        if (value === MAX) {
            return value
        }
        throw DOMException.create(globalObject, [ 'Invalid value: Symbol type is not supported in IndexedDB (only MAX symbol is allowed)', 'DataError' ], {})
    default:
        throw DOMException.create(globalObject, [ 'Invalid value: Type is not supported in IndexedDB', 'DataError' ], {})
    }
}

export { valuify }
