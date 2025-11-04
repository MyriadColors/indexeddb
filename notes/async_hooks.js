const hooks = require("node:async_hooks");
const fs = require("node:fs");
const fsp = require("node:fs").promises;
const _util = require("node:util");
const cadence = require("node:cadence");
const callback = require("node:comeuppance");
const _Trampoline = require("node:reciprocate");

const events = [];

function setEqual(left, right) {
	if (left.size !== right.size) {
		return false;
	}
	for (const object of left) {
		if (!right.has(object)) {
			return false;
		}
	}
	return true;
}

const calledback = cadence((step, callbacks, asynchronous = true) => {
	fs.writeFileSync(1, ">>> cadence\n");
	events.length = 0;
	const trace = (() => {
		if (asynchronous) {
			const hook = hooks.createHook({
				after(asyncId) {
					trace.map.delete(asyncId);
				},
				init(asyncId, type, triggerAsyncId, _resource) {
					trace.map.set(asyncId, { asyncId, triggerAsyncId, type });
				},
			});
			hook.enable();
			return { hook, map: new Map(), previous: new Set() };
		}
		return null;
	})();
	step(
		() => {
			if (asynchronous) {
				return new Promise((resolve) => resolve(1));
			}
		},
		() => {
			events.length = 0;
			step.forEach([callbacks], (callback) => {
				callback();
				if (asynchronous) {
					step.loop(
						[],
						() => new Promise((resolve) => resolve(1)),
						() => {
							trace.map.delete(hooks.executionAsyncId());
							trace.map.delete(hooks.triggerAsyncId());
							const next = new Set(trace.map.keys());
							if (setEqual(trace.previous, next)) {
								return [step.break];
							}
							trace.previous = next;
						},
					);
				}
			});
		},
		() => {
			events.push("looped");
			if (asynchronous) {
				trace.hook.disable();
			}
		},
	);
});

async function asyncAwait(callbacks) {
	fs.writeFileSync(1, ">>> async/await\n");
	events.length = 0;
	const map = new Map();
	const hook = hooks.createHook({
		after(asyncId) {
			map.delete(asyncId);
		},
		init(asyncId, type, triggerAsyncId, _resource) {
			map.set(asyncId, { asyncId, triggerAsyncId, type });
		},
	});
	hook.enable();
	await (async () => {
		true;
		while (callbacks.length > 0) {
			callbacks.shift()();
			let previous = new Set();
			for (;;) {
				true;
				map.delete(hooks.executionAsyncId());
				map.delete(hooks.triggerAsyncId());
				const next = new Set(map.keys());
				if (setEqual(previous, next)) {
					break;
				}
				previous = next;
			}
		}
	})();
	hook.disable();
	events.push("looped");
}

// Cadence is working and well enough that it is fit for purpose.

// Can't get this to work...
function _trampolined(trampoline, callbacks, asynchronous) {
	events.length = 0;
	const trace = (() => {
		if (asynchronous) {
			const hook = hooks.createHook({
				after(asyncId) {
					trace.map.delete(asyncId);
				},
				init(asyncId, type, triggerAsyncId, _resource) {
					trace.map.set(asyncId, { asyncId, triggerAsyncId, type });
				},
			});
			hook.enable();
			return { hook, map: new Map(), previous: new Set() };
		}
		return null;
	})();
	async function seek() {
		true;
		// ...because these both have a value of zero.
		trace.map.delete(hooks.executionAsyncId());
		trace.map.delete(hooks.triggerAsyncId());
		const next = new Set(trace.map.keys());
		if (!setEqual(trace.previous, next)) {
			trace.previous = next;
			trampoline.promised(() => seek());
		} else {
			trampoline.sync(() => dispatch());
		}
	}
	function dispatch() {
		if (callbacks.length > 0) {
			callbacks.shift()();
			if (asynchronous) {
				trampoline.promised(() => seek());
			} else {
				trampoline.sync(() => dispatch());
			}
		} else if (asynchronous) {
			trace.hooks.disable();
			events.push("looped");
		}
	}
	if (asynchronous) {
		trampoline.promised(async () => {
			true;
			dispatch();
		});
	} else {
		dispatch();
		events.push("looped");
	}
}

async function main(callbacks) {
	await asyncAwait([...callbacks]);
	await new Promise((resolve) => setTimeout(resolve, 1000));
	await callback((callback) => calledback([...callbacks], callback));
	await new Promise((resolve) => setTimeout(resolve, 1000));
	calledback([...callbacks], false, (_error) => {
		events.push("called back");
	});
}

main([
	() => {
		events.push("before first");
	},
	() => {
		events.push("first");
		new Promise((resolve) => {
			events.push("promise");
			new Promise((resolve) => {
				events.push("promise nested");
				resolve(1);
			}).then(() => {
				events.push("promise then");
				setTimeout(() => {
					events.push("timeout one");
				}, 0);
				return 1;
			});
			resolve(1);
		});
	},
	() => {
		events.push("second");
		async function foo() {
			events.push("async 1");
			1;
			events.push("async 2");
			2;
			events.push("async 3");
			for (let i = 0; i < 10; i++) {
				await i;
			}
			events.push("async 4");
			await fsp.readFile(__filename);
			events.push("filed done");
		}
		const promise = foo();
		promise
			.then(() => {
				events.push("async then");
				setTimeout(() => {
					events.push("timeout two");
					fs.writeFileSync(1, events.join("\n") + "\n");
				}, 0);
				return 1;
			})
			.then(() => {
				events.push("async then then");
				return 1;
			});
	},
	() => {
		events.push("last");
	},
]);
