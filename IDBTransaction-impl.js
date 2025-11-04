import { create as __create } from "domexception/lib/DOMException";
import { deserialize, serialize } from "verbatim";
import compare from "./compare";
import { dispatchEvent } from "./dispatch";
import { create as _create } from "./living/generated/DOMStringList";

import { createImpl } from "./living/generated/Event";
import { create } from "./living/generated/IDBObjectStore";
import { setupForSimpleEventAccessors } from "./living/helpers/create-event-accessor";
import { implementation as EventTargetImpl } from "./living/idl/EventTarget-impl";
import structuredClone from "./structuredClone";
import { valuify } from "./value";

class IDBTransactionImpl extends EventTargetImpl {
	constructor(
		globalObject,
		_args,
		{
			schema,
			request = null,
			database,
			mode,
			names = [],
			previousVersion = null,
			durability,
		},
	) {
		super(globalObject, [], {});
		if (mode === null) {
			throw new Error();
		}
		this.durability = durability;
		this._globalObject = globalObject;
		this._schema = schema;
		this._state = "active";
		this._database = database;
		this._request = request;
		this._queue = [];
		this._mode = mode;
		this._names = names;
		this._previousVersion = previousVersion;
	}

	get objectStoreNames() {
		let array;
		if (this._names.length === 0) {
			array = this._schema.getObjectStoreNames().toSorted();
		} else {
			array = this._names.toSorted();
		}
		return _create(this._globalObject, [], { array });
	}

	get mode() {
		return this._mode;
	}

	get db() {
		return this._database;
	}

	_getTheParent() {
		return this._database;
	}

	objectStore(name) {
		if (this._state === "finished") {
			throw __create(
				this._globalObject,
				["The transaction has finished.", "InvalidStateError"],
				{},
			);
		}
		if (
			this._names.length === 0
				? this._schema.getObjectStore(name) === null
				: !~this._names.indexOf(name)
		) {
			throw __create(
				this._globalObject,
				[`Object store '${name}' not found.`, "NotFoundError"],
				{},
			);
		}
		return create(this._globalObject, [], {
			name,
			schema: this._schema,
			transaction: this,
		});
	}

	abort() {
		// If already finished, ignore subsequent abort calls (idempotent behavior)
		if (this._state === "finished") {
			return;
		}
		this._state = "finished";
		this._schema.abort();
		if (this._mode === "versionchange") {
			this._database.version = this._previousVersion;
		}
		this._aborted = true;
	}

	async _next({ store, _request, cursor }, transaction) {
		let unique = null;
		for (;;) {
			const next = cursor._inner.next();
			if (next.done) {
				cursor._outer.next = await cursor._outer.iterator.next();
				if (cursor._outer.next.done) {
					if (unique !== null) {
						const got = {
							key: unique.key,
							value: await transaction.get(store.qualified, [unique.referent]),
						};
						unique = null;
						return got;
					}
					return null;
				}
				cursor._inner = cursor._outer.next.value[Symbol.iterator]();
			} else {
				switch (cursor._type) {
					case "store": {
						return { key: next.value.key, value: next.value };
					}
					case "index": {
						if (cursor._direction === "prevunique") {
							if (unique !== null) {
								if (
									compare(this._globalObject, unique.key, next.value.key) !== 0
								) {
									return {
										key: unique.key,
										value: await transaction.get(store.qualified, [
											unique.referent,
										]),
									};
								}
							}
							unique = next.value;
						} else if (cursor._direction === "nextunique") {
							if (
								cursor._key !== null &&
								compare(this._globalObject, cursor._key, next.value.key) === 0
							) {
								continue;
							}
							return {
								key: next.value.key,
								value: await transaction.get(store.qualified, [
									next.value.referent,
								]),
							};
						} else {
							return {
								key: next.value.key,
								value: await transaction.get(store.qualified, [
									next.value.referent,
								]),
							};
						}
					}
				}
			}
		}
	}

	_delete(transaction, store, { key, value }) {
		transaction.unset(store.qualified, [key]);
		for (const indexName in store.index) {
			if (!Object.hasOwn(store.index, indexName)) {
				continue;
			}
			const index = this._schema._pending.store[store.index[indexName]];
			if (!index.extant) {
				continue;
			}
			let extracted;
			try {
				extracted = valuify(
					this._globalObject,
					this._schema.getExtractor(index.id)(value),
				);
			} catch (error) {
				// Only catch DataError from invalid index key values - silently skip invalid keys
				// Note: Can't use `rescue(error, [{ name: 'DataError' }])` because semblance only
				// checks own properties, and DOMException.name is not an own property.
				if (
					error instanceof this._globalObject.DOMException &&
					error.name === "DataError"
				) {
					continue;
				}
				// Re-throw any other errors (other DOMException types or non-DOMException errors)
				throw error;
			}
			transaction.unset(index.qualified, [extracted, key]);
		}
	}

	_extractIndexed(index, value) {
		const values = [];
		const extracted = this._schema.getExtractor(index.id)(value);
		if (index.multiEntry && Array.isArray(extracted)) {
			for (const value of extracted) {
				try {
					values.push(valuify(this._globalObject, value));
				} catch (error) {
					// Only catch DataError from invalid index key values - silently skip invalid keys
					// Note: Can't use `rescue(error, [{ name: 'DataError' }])` because semblance only
					// checks own properties, and DOMException.name is not an own property.
					if (
						error instanceof this._globalObject.DOMException &&
						error.name === "DataError"
					) {
						// Skip this invalid key value
						continue;
					}
					// Re-throw any other errors (other DOMException types or non-DOMException errors)
					throw error;
				}
			}
		} else {
			try {
				values.push(valuify(this._globalObject, extracted));
			} catch (error) {
				// Only catch DataError from invalid index key values - silently skip invalid keys
				// Note: Can't use `rescue(error, [{ name: 'DataError' }])` because semblance only
				// checks own properties, and DOMException.name is not an own property.
				if (
					error instanceof this._globalObject.DOMException &&
					error.name === "DataError"
				) {
					// Skip this invalid key value
					return values;
				}
				// Re-throw any other errors (other DOMException types or non-DOMException errors)
				throw error;
			}
		}
		return values;
	}

	_dispatchItem({ cursor, request }, got) {
		request.readyState = "done";
		if (got === null) {
			request._result = null;
		} else {
			cursor._key = got.key;
			cursor._value = got.value;
			cursor._gotValue = true;
		}
		return this._dispatchSuccess(request);
	}

	// ============================================================================
	// Helper Methods for Common Operations
	// ============================================================================

	_dispatchSuccess(request, result) {
		if (result !== undefined) {
			request._result = result;
		}
		request.readyState = "done";
		return dispatchEvent(
			this,
			request,
			createImpl(this._globalObject, ["success"], {}),
		);
	}

	async _dispatchError(
		request,
		errorMessage,
		errorName = "ConstraintError",
		target = null,
	) {
		const event = createImpl(
			this._globalObject,
			["error", { bubbles: true, cancelable: true }],
			{},
		);
		const error = __create(this._globalObject, [errorMessage, errorName], {});
		request.readyState = "done";
		request._error = error;
		await dispatchEvent(target, request, event);
		return event;
	}

	async _dispatchAbortError(request) {
		delete request._result;
		request.readyState = "done";
		request._error = __create(
			this._globalObject,
			["The transaction was aborted.", "AbortError"],
			{},
		);
		return dispatchEvent(
			null,
			request,
			createImpl(
				this._globalObject,
				["error", { bubbles: true, cancelable: true }],
				{},
			),
		);
	}

	_iterateStoreIndexes(store, callback) {
		for (const indexName in store.index) {
			if (!Object.hasOwn(store.index, indexName)) {
				continue;
			}
			const index = this._schema._pending.store[store.index[indexName]];
			if (!index.extant) {
				continue;
			}
			callback(index, indexName);
		}
	}

	_createSuccessEvent() {
		return createImpl(this._globalObject, ["success"], {});
	}

	_createCompleteEvent() {
		return createImpl(this._globalObject, ["complete"], {});
	}

	_createAbortEvent() {
		return createImpl(
			this._globalObject,
			["abort", { bubbles: true, cancelable: true }],
			{},
		);
	}

	// ============================================================================
	// Main Transaction Execution Loop
	// ============================================================================
	//
	// Most of the logic of this implementation is in this one function.
	// The interface implementations do a lot of argument validation, but
	// most of the real work is here.

	async _run(transaction) {
		await new Promise((resolve) => setImmediate(resolve));
		while (this._queue.length > 0) {
			const event = this._queue.shift();

			// Handle aborted transactions
			if (this._state === "finished") {
				const { request } = event;
				if (request !== null) {
					await this._dispatchAbortError(request);
				}
				continue;
			}

			// Route to appropriate handler based on method
			switch (event.method) {
				case "create": {
					await this._handleCreate(transaction, event);
					break;
				}
				case "deleteStore":
					// Note: deleteObjectStore uses 'destroy' method, not 'deleteStore'.
					// This case is kept for backwards compatibility or future use.
					// The actual deletion is handled by the 'destroy' case with type: { 'store'
					void event;
					break;

				case "set":
					await this._handleSet(transaction, event);
					break;
				case "get":
					await this._handleGet(transaction, event);
					break;

				case "getAll":
					await this._handleGetAll(transaction, event);
					break;
				case "openCursor":
					await this._handleOpenCursor(transaction, event);
					break;

				case "continue":
					await this._handleContinue(transaction, event);
					break;

				case "advance":
					await this._handleAdvance(transaction, event);
					break;

				case "count":
					await this._handleCount(transaction, event);
					break;

				case "clear":
					await this._handleClear(transaction, event);
					break;

				case "delete":
					await this._handleDelete(transaction, event);
					break;

				case "rename":
					await this._handleRename(transaction, event);
					break;

				case "destroy":
					await this._handleDestroy(transaction, event);
					break;
			}
			await new Promise((resolve) => setImmediate(resolve));
		}

		// Finalize transaction (commit or abort)
		await this._finalizeTransaction(transaction);
	}

	// ============================================================================
	// Transaction Event Handlers
	// ============================================================================

	async _handleCreate(transaction, event) {
		// Don't worry about rollback of the update to the schema object. We
		// are not going to use this object if the upgrade fails.
		switch (event.type) {
			case "store": {
				{
					const { store } = event;
					transaction.set("schema", store);
					await transaction.store(store.qualified, { key: "indexeddb" });
				}
				break;
			}
			case "index": {
				{
					const { store, index } = event;
					await transaction.store(index.qualified, {
						key: "indexeddb",
						referent: "indexeddb",
					});
					transaction.set("schema", store);
					transaction.set("schema", index);

					// Populate index with existing store data
					this._schema.getExtractor(index.id);
					for await (const items of transaction.cursor(store.qualified)) {
						for (const item of items) {
							for (const value of this._extractIndexed(index, item.value)) {
								transaction.set(index.qualified, {
									key: value,
									referent: item.key,
								});
							}
						}
					}

					// Validate uniqueness constraint if applicable
					if (index.unique) {
						await this._validateUniqueIndex(transaction, index);
					}

					index.extant = true;
				}
				break;
			}
		}
	}

	async _validateUniqueIndex(transaction, index) {
		let previous = null;
		let count = 0;

		for await (const items of transaction.cursor(index.qualified)) {
			for (const item of items) {
				if (count++ === 0) {
					previous = item;
					continue;
				}
				if (compare(this._globalObject, previous.key, item.key) === 0) {
					this.error = __create(
						this._globalObject,
						[
							"Unique index constraint violation: duplicate key found.",
							"ConstraintError",
						],
						{},
					);
					this.abort();
					return;
				}
				previous = item;
			}
		}
	}

	async _handleSet(transaction, event) {
		const { store, key, value, overwrite, request } = event;
		const existing = await transaction.get(store.qualified, [key]);

		if (existing !== null) {
			if (!overwrite) {
				const errorEvent = await this._dispatchError(
					request,
					"Unique key constraint violation.",
					"ConstraintError",
					null,
				);
				if (!errorEvent._canceledFlag) {
					this.abort();
				}
				return;
			}

			// Remove old index entries
			this._iterateStoreIndexes(store, (index) => {
				const values = this._extractIndexed(index, existing.value);
				for (const indexValue of values) {
					transaction.unset(index.qualified, [indexValue, key]);
				}
			});
		}

		// Set the record
		const record = { key, value };
		transaction.set(store.qualified, record);

		// Add new index entries
		this._iterateStoreIndexes(store, async (index) => {
			const values = this._extractIndexed(index, record.value);
			for (const indexValue of values) {
				// Check uniqueness constraint if applicable
				if (index.unique) {
					const existingEntries = await transaction
						.cursor(index.qualified, [indexValue])
						.terminate(
							(item) => compare(this._globalObject, item.key, indexValue) !== 0,
						)
						.array();

					if (existingEntries.length > 0) {
						const errorEvent = await this._dispatchError(
							request,
							"Unique key constraint violation.",
							"ConstraintError",
							this,
						);
						if (!errorEvent._canceledFlag) {
							this.error = __create(
								this._globalObject,
								[
									"Unique index constraint violation: duplicate key found.",
									"ConstraintError",
								],
								{},
							);
							this.abort();
						}
						return;
					}
				}
				transaction.set(index.qualified, { key: indexValue, referent: key });
			}
		});

		await this._dispatchSuccess(request, key);
	}

	async _handleGet(transaction, event) {
		switch (event.type) {
			case "store": {
				{
					const { store, query, request, keys } = event;
					const cursor = query.lower ? [query.lower] : null;
					const results = await transaction
						.cursor(store.qualified, cursor)
						.terminate((item) => !query.includes(item.key))
						.limit(1)
						.array();

					if (results.length > 0) {
						const result = keys ? results[0].key : results[0].value;
						await this._dispatchSuccess(
							request,
							structuredClone(this._globalObject, result),
						);
					} else {
						await this._dispatchSuccess(request);
					}
				}
				break;
			}
			case "index": {
				{
					const { store, query, index, key, request } = event;
					// Note: If query.lower is null but query.upper is not, we need to start from the beginning
					// and terminate when we exceed the upper bound. The cursor handles this via the terminate clause.
					const cursor =
						query.lower === null
							? transaction.cursor(index.qualified)
							: transaction.cursor(index.qualified, [query.lower]);

					const indexResults = await cursor
						.terminate((item) => !query.includes(item.key))
						.limit(1)
						.array();

					if (indexResults.length > 0) {
						const got = await transaction.get(store.qualified, [
							indexResults[0].referent,
						]);
						const result = key ? got.key : got.value;
						await this._dispatchSuccess(
							request,
							deserialize(serialize(result)),
						);
					} else {
						await this._dispatchSuccess(request);
					}
				}
				break;
			}
		}
	}

	async _handleGetAll(transaction, event) {
		switch (event.type) {
			case "store": {
				{
					const { store, query, count, request, keys } = event;
					const cursor = transaction.cursor(
						store.qualified,
						query.lower === null ? null : [query.lower],
					);
					const terminated =
						query.lower === null
							? cursor
							: cursor.terminate((item) => !query.includes(item.key));
					const limited =
						count === null || count === 0 ? terminated : cursor.limit(count);
					const exclusive =
						query.lower !== null && query.lowerOpen
							? limited.exclusive()
							: limited;
					const array = await exclusive.array();

					const result = keys
						? array.map((item) => item.key)
						: array.map((item) => item.value);

					await this._dispatchSuccess(request, result);
				}
				break;
			}
			case "index": {
				{
					const { store, index, query, count, request, keys } = event;
					// Note: When searching by partial key on an index, we can't use the `exclusive`
					// property directly. We use a special `MAX` value for exclusive searches to position
					// at a record greater than the greatest possible record of the specified key.
					// The exclusive flag isn't necessary since this record will never be found.
					const key = query.lower === null ? null : [query.lower];
					const cursor = transaction.cursor(index.qualified, key);
					const terminated =
						query.lower === null
							? cursor
							: cursor.terminate((item) => !query.includes(item.key));
					const limited =
						count === null || count === 0 ? terminated : cursor.limit(count);
					const exclusive = query.lowerOpen ? limited.exclusive() : limited;

					// Collect results by looking up each index entry's referent in the store
					// Note: Could be optimized with Memento join for better performance on large datasets
					const result = [];
					for await (const items of exclusive) {
						for (const item of items) {
							const got = await transaction.get(store.qualified, [
								item.referent,
							]);
							// Use structuredClone to ensure proper deep copying per IndexedDB spec
							const value = keys ? got.key : got.value;
							result.push(structuredClone(this._globalObject, value));
						}
					}
					await this._dispatchSuccess(request, result);
				}
				break;
			}
		}
	}

	_buildCursorBuilder(transaction, event) {
		const { query, store, index, direction } = event;
		const isStore = event.type === "store";
		const qualified = isStore ? store.qualified : index.qualified;

		let builder;

		if (isStore) {
			switch (direction) {
				case "next":
				case "nextunique": {
					builder =
						query.lower === null
							? transaction.cursor(qualified)
							: transaction.cursor(qualified, [query.lower]);
					if (query.lowerOpen) {
						builder = builder.exclusive();
					}
					if (query.upper !== null) {
						builder = builder.terminate((item) => !query.includes(item.key));
					}
					break;
				}
				case "prev":
				case "prevunique": {
					builder =
						query.upper === null
							? transaction.cursor(qualified)
							: transaction.cursor(qualified, [query.upper]);
					if (query.lower !== null) {
						builder = builder.terminate((item) => !query.includes(item.key));
					}
					builder = builder.toReversed();
					break;
				}
			}
		} else {
			switch (direction) {
				case "next":
				case "nextunique": {
					{
						// Note: When searching by partial key on an index, we can't use the `exclusive`
						// property directly. We use a special `MAX` value for exclusive searches.
						const key = query.lower === null ? null : [query.lower];
						builder = transaction.cursor(qualified, key);
						if (query.lowerOpen) {
							builder = builder.exclusive();
						}
						if (query.upper !== null) {
							builder = builder.terminate((item) => !query.includes(item.key));
						}
					}
					break;
				}
				case "prev":
				case "prevunique": {
					builder = transaction.cursor(
						qualified,
						query.upper === null ? null : [query.upper],
					);
					builder = query.upperOpen ? builder.exclusive() : builder;
					builder = builder.toReversed();
					if (query.lower !== null) {
						builder = builder.terminate((item) => !query.includes(item.key));
					}
					break;
				}
			}
		}

		return builder;
	}

	async _handleOpenCursor(transaction, event) {
		const { cursor } = event;
		const builder = this._buildCursorBuilder(transaction, event);

		cursor._outer = { iterator: builder[Symbol.asyncIterator](), next: null };
		cursor._inner = {
			next() {
				return { done: true, value: null };
			},
		};

		const got = await this._next(event, transaction);
		await this._dispatchItem(event, got);
	}

	async _handleContinue(transaction, event) {
		const { cursor, key, primaryKey } = event;

		if (primaryKey === null) {
			// Handle prevunique direction for index cursors
			if (cursor._direction === "prevunique" && cursor._type === "index") {
				const query = cursor._query;
				const index = cursor._index;
				const builder = transaction
					.cursor(index.qualified, [cursor._key])
					.toReversed()
					.exclusive();

				if (query.lower !== null) {
					builder.terminate((item) => !query.includes(item.key));
				}

				cursor._outer = {
					iterator: builder[Symbol.asyncIterator](),
					next: null,
				};
				cursor._inner = {
					next() {
						return { done: true, value: null };
					},
				};
			}

			// Continue until key threshold or end
			for (;;) {
				const got = await this._next(event, transaction);
				if (
					got === null ||
					key === null ||
					compare(this._globalObject, key, got.key) <= 0
				) {
					await this._dispatchItem(event, got);
					break;
				}
			}
		} else {
			// Continue with primary key constraint
			for (;;) {
				const got = await this._next(event, transaction);
				if (
					got === null ||
					(compare(this._globalObject, got.key, key) === 0 &&
						compare(this._globalObject, got.value.key, primaryKey) >= 0) ||
					compare(this._globalObject, got.key, key) > 0
				) {
					await this._dispatchItem(event, got);
					break;
				}
			}
		}
	}

	async _handleAdvance(transaction, event) {
		const { request, cursor } = event;

		if (cursor._direction === "prevunique") {
			throw new Error("advance not supported for prevunique direction");
		}

		let count = event.count - 1;
		// Optimized loop: skip ahead by count without processing intermediate items
		// This is more efficient than calling _next for each position
		while (count !== 0) {
			const next = cursor._inner.next();
			if (next.done) {
				cursor._outer.next = await cursor._outer.iterator.next();
				if (cursor._outer.next.done) {
					// Reached end of cursor before completing advance
					await this._dispatchSuccess(request, null);
					return;
				}
				// Reset inner iterator for the new outer value
				cursor._inner = cursor._outer.next.value[Symbol.iterator]();
			}
			count--;
		}

		const got = await this._next(event, transaction);
		await this._dispatchItem(event, got);
	}

	async _handleCount(transaction, event) {
		switch (event.type) {
			case "store": {
				{
					const { store, request, query } = event;
					let cursor =
						query.lower === null
							? transaction.cursor(store.qualified)
							: transaction.cursor(store.qualified, [query.lower]);
					cursor =
						query.upper === null
							? cursor
							: cursor.terminate((item) => !query.includes(item.key));

					let count = 0;
					for await (const items of cursor) {
						for (const _item of items) {
							count++;
						}
					}
					await this._dispatchSuccess(request, count);
				}
				break;
			}
			case "index": {
				{
					const { index, request, query } = event;
					let cursor =
						query.lower === null
							? transaction.cursor(index.qualified)
							: transaction.cursor(index.qualified, [query.lower]);
					cursor =
						query.upper === null
							? cursor
							: cursor.terminate((item) => !query.includes(item.key));

					let count = 0;
					for await (const items of cursor) {
						for (const _item of items) {
							count++;
						}
					}
					await this._dispatchSuccess(request, count);
				}
				break;
			}
		}
	}

	async _handleClear(transaction, event) {
		const { store, request } = event;
		// Clear all records from the store
		// Note: _delete() automatically handles removing entries from all associated indexes,
		// so no additional index cleanup is needed
		for await (const items of transaction.cursor(store.qualified)) {
			for (const item of items) {
				this._delete(transaction, store, item);
			}
		}

		await this._dispatchSuccess(request);
	}

	async _handleDelete(transaction, event) {
		const { store, request, query } = event;
		let cursor =
			query.lower === null
				? transaction.cursor(store.qualified)
				: transaction.cursor(store.qualified, [query.lower]);
		cursor =
			query.upper === null
				? cursor
				: cursor.terminate((item) => !query.includes(item.key));

		for await (const items of cursor) {
			for (const item of items) {
				this._delete(transaction, store, item);
			}
		}
		await this._dispatchSuccess(request);
	}

	async _handleRename(transaction, event) {
		switch (event.type) {
			case "store": {
				{
					const { store } = event;
					transaction.set("schema", store);
				}
				break;
			}
			case "index": {
				{
					const { store, index } = event;
					transaction.set("schema", store);
					transaction.set("schema", index);
				}
				break;
			}
		}
	}

	async _handleDestroy(transaction, event) {
		switch (event.type) {
			case "store": {
				{
					const { store } = event;
					// Remove all indexes associated with this store first
					// We iterate through the store's indexes and remove each one
					for (const indexName in store.index) {
						if (!Object.hasOwn(store.index, indexName)) {
							continue;
						}
						const indexId = store.index[indexName];
						const indexStore = this._schema._pending.store[indexId];
						if (indexStore?.extant) {
							await transaction.remove(indexStore.qualified);
						}
					}
					// Then remove the store itself
					await transaction.remove(store.qualified);
				}
				break;
			}
			case "index": {
				{
					// Remove the index - the store relationship is maintained in the schema
					// so we don't need to update the store's index list here (schema handles it)
					const { index } = event;
					await transaction.remove(index.qualified);
				}
				break;
			}
		}
	}

	async _finalizeTransaction(transaction) {
		if (this._state === "finished") {
			// Abort path
			this._schema.reset();
			// Clear transaction reference from database
			// Note: This is also done in IDBFactory when handling errors,
			// but we need it here for normal transaction completion/abort
			this._database._transaction = null;
			await dispatchEvent(null, this, this._createAbortEvent());

			// Must do this immediately before transaction rollback
			if (this._request) {
				this._request.transaction = null;
			}
			if (transaction.rollback) {
				transaction.rollback();
			}
		} else {
			// Commit path
			this._state = "committing";
			if (transaction.commit) {
				await transaction.commit();
			}
			this._schema.merge();
			this._state = "finished";
			this._database._transaction = null;
			await dispatchEvent(null, this, this._createCompleteEvent());

			if (this._request) {
				this._request.transaction = null;
			}
		}
	}
}

setupForSimpleEventAccessors(IDBTransactionImpl.prototype, [
	"complete",
	"abort",
	"error",
]);

export const implementation = IDBTransactionImpl;
