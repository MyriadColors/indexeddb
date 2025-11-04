import { create } from "domexception/lib/DOMException";

export function vivify(globalObject, object, path, value) {
	const parts = path.split(".");
	let iterator = object;
	while (parts.length !== 1) {
		const part = parts.shift();
		if (!Object.hasOwn(iterator, part)) {
			Object.defineProperty(iterator, part, {
				configurable: true,
				enumerable: true,
				value: {},
				writable: true,
			});
		}
		const object = iterator[part];
		if (
			typeof object !== "object" ||
			object === null ||
			Array.isArray(object)
		) {
			throw create(globalObject, ["TODO: message", "DataError"], {});
		}
		iterator = object;
	}
	Object.defineProperty(iterator, parts[0], {
		configurable: true,
		enumerable: true,
		value: value,
		writable: true,
	});
}
