const webidl = require("./living/generated/utils");
const { callback } = require("comeuppance");

// Save and temporarily reset error handler for error events to prevent user handlers
// from interfering with IndexedDB internal error handling, then restore afterward.
async function dispatchEvent(transaction, eventTargetImpl, eventImpl) {
	webidl.tryWrapperForImpl(eventImpl);

	// Save and temporarily reset error handler for error events
	const isErrorEvent = eventImpl.type === "error";
	let originalErrorHandler;
	let handlerWasSaved = false;

	if (
		isErrorEvent &&
		typeof eventTargetImpl._getEventHandlerFor === "function"
	) {
		try {
			originalErrorHandler = eventTargetImpl._getEventHandlerFor("error");
			// Only reset if there was an existing handler
			if (
				originalErrorHandler !== undefined &&
				typeof eventTargetImpl._setEventHandlerFor === "function"
			) {
				eventTargetImpl._setEventHandlerFor("error", null);
				handlerWasSaved = true;
			}
		} catch (error) {
			// If handler management fails, log but don't break dispatch
			console.warn("Failed to save error handler:", error);
		}
	}

	if (transaction !== null) {
		transaction._state = "active";
	}

	try {
		await callback((callback) =>
			eventTargetImpl._dispatch(eventImpl, false, true, true, callback),
		);
		if (transaction !== null && transaction._state === "active") {
			transaction._state = "inactive";
		}
		if (eventImpl._legacyOutputDidListenersThrowFlag) {
			console.log("LEGACY OUTPUT DID LISTENERS THROW");
			throw new Error();
		}
	} finally {
		// Always restore the original error handler if we saved it
		if (
			handlerWasSaved &&
			typeof eventTargetImpl._setEventHandlerFor === "function"
		) {
			try {
				// Restore to original value (which could be null, undefined, or a function)
				eventTargetImpl._setEventHandlerFor("error", originalErrorHandler);
			} catch (error) {
				// Log but don't throw - dispatch already completed
				console.warn("Failed to restore error handler:", error);
			}
		}
	}
}

exports.dispatchEvent = dispatchEvent;
