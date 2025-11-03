import { supportedPropertyIndices, supportsPropertyIndex } from './living/generated/utils'

class DOMStringListImpl {
    constructor (_globalObject, _args, { array = [] }) {
        this._array = array
    }

    get length () {
        return this._array.length
    }

    contains (string) {
        return ~this._array.indexOf(string)
    }

    item (i) {
        return this._array[i]
    }

    [supportsPropertyIndex]() {
        return true
    }

    get [supportedPropertyIndices]() {
        return this._array.map((_value, index) => index)
    }
}

export const implementation = DOMStringListImpl
