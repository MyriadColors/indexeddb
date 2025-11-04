import { DOMException } from "domexception/lib/DOMException";
import { Future } from "perhaps";
import extractor from "./extractor";

import { DOMStringList } from "./living/generated/DOMStringList";
import { IDBObjectStore } from "./living/generated/IDBObjectStore.js";
import { IDBTransaction } from "./living/generated/IDBTransaction.js";
import { webidl } from "./living/generated/utils.js";
import { setupForSimpleEventAccessors } from "./living/helpers/create-event-accessor";
import { implementation as EventTargetImpl } from "./living/idl/EventTarget-impl.js";

class IDBDatabaseImpl extends EventTargetImpl {
	constructor(globalObject, _args, { name, schema, transactor, version }) {
		super(globalObject, [], {});
		this._globalObject = globalObject;
		this._schema = schema;
		this._transactor = transactor;
		this._transaction = null;
		this._closing = false;
		this._closed = new Future();
		this.name = name;
		this.version = version;
		this._transactions = new Set();
	}

	get objectStoreNames() {
		return DOMStringList.create(this._globalObject, [], {
			array: this._schema.getObjectStoreNames().toSorted(),
		});
	}

	transaction(names, mode, options) {
		if (this._transaction !== null) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "InvalidStateError"],
				{},
			);
		}
		if (this._closing) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "InvalidStateError"],
				{},
			);
		}
		if (typeof names === "string") {
			names = [names];
		}
		names = names.filter((name, index) => names.indexOf(name) === index);
		for (const name of names) {
			if (!this._schema.getObjectStore(name)) {
				throw DOMException.create(
					this._globalObject,
					["TODO: message", "NotFoundError"],
					{},
				);
			}
		}
		if (names.length === 0) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "InvalidAccessError"],
				{},
			);
		}
		if (mode !== "readonly" && mode !== "readwrite") {
			throw new TypeError();
		}
		const transaction = IDBTransaction.createImpl(this._globalObject, [], {
			database: this,
			durability: options.durability,
			mode,
			names,
			schema: this._schema,
		});
		this._transactions.add(transaction);
		this._transactor.transaction(
			{ db: this, transaction },
			names,
			mode === "readonly",
		);
		return webidl.wrapperForImpl(transaction);
	}

	createObjectStore(name, { autoIncrement = false, keyPath = null } = {}) {
		// **TODO** Assert we do not have a transaction error.
		if (name === undefined) {
			throw new TypeError();
		}
		if (this._transaction === null) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "InvalidStateError"],
				{},
			);
		}
		if (this._transaction._state !== "active") {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "TransactionInactiveError"],
				{},
			);
		}
		const canAutoIncrement =
			keyPath === null || extractor.verify(this._globalObject, keyPath);
		if (this._schema.getObjectStore(name) !== null) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "ConstraintError"],
				{},
			);
		}
		if (autoIncrement && !canAutoIncrement) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "InvalidAccessError"],
				{},
			);
		}
		const store = this._schema.createObjectStore(name, keyPath, autoIncrement);
		this._transaction._queue.push({
			method: "create",
			store: store,
			type: "store",
		});
		return IDBObjectStore.create(this._globalObject, [], {
			constructing: true,
			name,
			schema: this._schema,
			transaction: this._transaction,
		});
	}

	deleteObjectStore(name) {
		if (name === undefined) {
			throw new TypeError();
		}
		if (this._transaction === null) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "InvalidStateError"],
				{},
			);
		}
		if (this._transaction._state !== "active") {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "TransactionInactiveError"],
				{},
			);
		}
		const store = this._schema.getObjectStore(name);
		if (store === null) {
			throw DOMException.create(
				this._globalObject,
				["TODO: message", "NotFoundError"],
				{},
			);
		}
		this._schema.deleteObjectStore(name);
		this._transaction._queue.push({ method: "destroy", store: store });
	}

	// https://www.w3.org/TR/IndexedDB/#dom-idbdatabase-close
	close() {
		this._closing = true;
		this._transactor.queue.push({ extra: { db: this }, method: "close" });
	}

	// **TODO** `onabort`, `onclose`, `onerror`, `onversionchange`.
}

setupForSimpleEventAccessors(IDBDatabaseImpl.prototype, [
	"abort",
	"close",
	"error",
	"versionchange",
]);

module.exports = { implementation: IDBDatabaseImpl };
