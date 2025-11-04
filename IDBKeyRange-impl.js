const compare = require("./compare");

const { valuify } = require("./value");

class IDBKeyRangeImpl {
	// The args parameter is provided by the generated create method but we use
	// the options object instead, which contains the properly mapped values.
	// We valuify lower and upper to ensure they're always in the correct format
	// for comparison operations, even if they were already valuified by the
	// static construction methods.
	constructor(globalObject, _args, { lower, upper, lowerOpen, upperOpen }) {
		this._globalObject = globalObject;
		// Valuify lower and upper to ensure they're in the correct format for comparisons
		this._lower =
			lower !== undefined ? valuify(globalObject, lower) : undefined;
		this._upper =
			upper !== undefined ? valuify(globalObject, upper) : undefined;
		this._lowerOpen = lowerOpen;
		this._upperOpen = upperOpen;
	}

	get lower() {
		return this._lower;
	}

	get upper() {
		return this._upper;
	}

	get lowerOpen() {
		return this._lowerOpen;
	}

	get upperOpen() {
		return this._upperOpen;
	}

	includes(key) {
		const value = valuify(this._globalObject, key);
		return (
			(this._lower === undefined ||
				compare(this._globalObject, value, this._lower) >=
					(this._lowerOpen ? 1 : 0)) &&
			(this._upper === undefined ||
				compare(this._globalObject, value, this._upper) <=
					(this._upperOpen ? -1 : 0))
		);
	}
}

export const implementation = IDBKeyRangeImpl;
