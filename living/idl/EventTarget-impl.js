const DOMException = require("domexception/webidl2js-wrapper");
const hooks = require('node:async_hooks')

const idlUtils = require("../generated/utils");
const { nodeRoot } = require("../helpers/node");
import {
  isNode, isShadowRoot, isSlotable, getEventTargetParent,
  isShadowInclusiveAncestor, retarget
} from "../helpers/shadow-dom.js";

const cadence = require('cadence')

const MouseEvent = require("../generated/MouseEvent");

const EVENT_PHASE = {
  AT_TARGET: 2, BUBBLING_PHASE: 3, CAPTURING_PHASE: 1, NONE: 0
};

function setEqual (left, right) {
    if (left.size !== right.size) {
        return false
    }
    for (const object of left) {
        if (! right.has(object)) {
            return false
        }
    }
    return true
}

class EventTargetImpl {
  constructor(globalObject) {
    this._globalObject = globalObject;
    this._eventListeners = Object.create(null);
  }

  addEventListener(type, callback, options) {
    options = normalizeEventHandlerOptions(options, ["capture", "once", "passive"]);

    if (callback === null) {
      return;
    }

    if (!this._eventListeners[type]) {
      this._eventListeners[type] = [];
    }

    for (let i = 0; i < this._eventListeners[type].length; ++i) {
      const listener = this._eventListeners[type][i];
      if (
        listener.callback.objectReference === callback.objectReference &&
        listener.options.capture === options.capture
      ) {
        return;
      }
    }

    this._eventListeners[type].push({
      callback,
      options
    });
  }

  removeEventListener(type, callback, options) {
    options = normalizeEventHandlerOptions(options, ["capture"]);

    if (callback === null) {
      // Optimization, not in the spec.
      return;
    }

    if (!this._eventListeners[type]) {
      return;
    }

    for (let i = 0; i < this._eventListeners[type].length; ++i) {
      const listener = this._eventListeners[type][i];
      if (
        listener.callback.objectReference === callback.objectReference &&
        listener.options.capture === options.capture
      ) {
        this._eventListeners[type].splice(i, 1);
        break;
      }
    }
  }

  dispatchEvent(eventImpl) {
    if (eventImpl._dispatchFlag || !eventImpl._initializedFlag) {
      throw DOMException.create(this._globalObject, [
        "Tried to dispatch an uninitialized event",
        "InvalidStateError"
      ]);
    }
    if (eventImpl.eventPhase !== EVENT_PHASE.NONE) {
      throw DOMException.create(this._globalObject, [
        "Tried to dispatch a dispatching event",
        "InvalidStateError"
      ]);
    }

    eventImpl.isTrusted = false;

    let cancelled;
    const callback = (_error, result) => {
      cancelled = result;
    };

    this._dispatch(eventImpl, false, false, false, callback);

    return cancelled;
  }

  // https://dom.spec.whatwg.org/#get-the-parent
  _getTheParent() {
    return null;
  }

  // https://dom.spec.whatwg.org/#concept-event-dispatch
  // legacyOutputDidListenersThrowFlag optional parameter is not necessary here since it is only used by indexDB.
  _dispatch = cadence(function  _dispatch(step, eventImpl, targetOverride, legacyOutputDidListenersThrowFlag, asynchronous) {
        let targetImpl = this;
        const originalTarget = targetImpl; // Preserve original target for event path logic
        let clearTargets = false;
        let activationTarget = null;

        const trace = (() => {
            if (asynchronous) {
                const hook = hooks.createHook({
                    after (asyncId) {
                        trace.map.delete(asyncId)
                        console.log('after', asyncId)
                    }, init(asyncId, type, triggerAsyncId, resource) {
                        trace.map.set(asyncId, { asyncId, triggerAsyncId, type })
                        console.log('init', asyncId, type, triggerAsyncId, resource)
                    }
                })
                hook.enable()
                console.log('enable', hook)
                return { hook, map: new Map, previous: new Set }
            }
            return null
        }) ()

        eventImpl._dispatchFlag = true;

        targetOverride = targetOverride || targetImpl;
        let relatedTarget = retarget(eventImpl.relatedTarget, targetImpl);

        step(() => {
            if (targetImpl !== relatedTarget || targetImpl === eventImpl.relatedTarget) {
              const touchTargets = [];

              appendToEventPath(eventImpl, targetImpl, targetOverride, relatedTarget, touchTargets, false);

              const isActivationEvent = MouseEvent.isImpl(eventImpl) && eventImpl.type === "click";

              if (isActivationEvent && targetImpl._hasActivationBehavior) {
                activationTarget = targetImpl;
              }

              let slotInClosedTree = false;
              let slotable = isSlotable(targetImpl) && targetImpl._assignedSlot ? targetImpl : null;
              let parent = getEventTargetParent(targetImpl, eventImpl);

              // Populate event path
              // https://dom.spec.whatwg.org/#event-path
              while (parent !== null) {
                if (slotable !== null) {
                  if (parent.localName !== "slot") {
                    throw new Error(`JSDOM Internal Error: Expected parent to be a Slot`);
                  }

                  slotable = null;

                  const parentRoot = nodeRoot(parent);
                  if (isShadowRoot(parentRoot) && parentRoot.mode === "closed") {
                    slotInClosedTree = true;
                  }
                }

                if (isSlotable(parent) && parent._assignedSlot) {
                  slotable = parent;
                }

                relatedTarget = retarget(eventImpl.relatedTarget, parent);

                // Determine if we should add parent to event path without retargeting.
                // For non-Node EventTargets (like IDBRequest, IDBTransaction, IDBDatabase),
                // always add parents since there's no shadow DOM retargeting logic needed.
                // For Node EventTargets, check if parent is a shadow-inclusive ancestor of the original target.
                const shouldAddParentWithoutRetargeting = 
                  !isNode(originalTarget) || // Non-Node EventTargets: always bubble without retargeting
                  (isNode(parent) && isShadowInclusiveAncestor(parent, originalTarget)) || // Parent is ancestor of original target
                  idlUtils.wrapperForImpl(parent).constructor.name === "Window"; // Special case for Window

                if (shouldAddParentWithoutRetargeting) {
                  if (isActivationEvent && eventImpl.bubbles && activationTarget === null &&
                      parent._hasActivationBehavior) {
                    activationTarget = parent;
                  }

                  appendToEventPath(eventImpl, parent, null, relatedTarget, touchTargets, slotInClosedTree);
                } else if (parent === relatedTarget) {
                  parent = null;
                } else {
                  targetImpl = parent;

                  if (isActivationEvent && activationTarget === null && targetImpl._hasActivationBehavior) {
                    activationTarget = targetImpl;
                  }

                  appendToEventPath(eventImpl, parent, targetImpl, relatedTarget, touchTargets, slotInClosedTree);
                }

                if (parent !== null) {
                  parent = getEventTargetParent(parent, eventImpl);
                }

                slotInClosedTree = false;
              }

              let clearTargetsStructIndex = -1;
              for (let i = eventImpl._path.length - 1; i >= 0 && clearTargetsStructIndex === -1; i--) {
                if (eventImpl._path[i].target !== null) {
                  clearTargetsStructIndex = i;
                }
              }
              const clearTargetsStruct = eventImpl._path[clearTargetsStructIndex];

              clearTargets =
                  (isNode(clearTargetsStruct.target) && isShadowRoot(nodeRoot(clearTargetsStruct.target))) ||
                  (isNode(clearTargetsStruct.relatedTarget) && isShadowRoot(nodeRoot(clearTargetsStruct.relatedTarget)));

              if (activationTarget?._legacyPreActivationBehavior) {
                activationTarget._legacyPreActivationBehavior();
              }

                step(() => {
                    step.loop([ eventImpl._path.length - 1 ], (i) => {
                        if (i < 0) {
                            return [ step.break ]
                        }
                        const struct = eventImpl._path[i];

                        if (struct.target !== null) {
                            eventImpl.eventPhase = EVENT_PHASE.AT_TARGET;
                        } else {
                            eventImpl.eventPhase = EVENT_PHASE.CAPTURING_PHASE;
                        }
                        step(() => {
                            _invokeEventListeners(struct, eventImpl, "capturing", legacyOutputDidListenersThrowFlag, trace, step());
                        }, () => i - 1)
                    })
                }, () => {
                    step.forEach([ eventImpl._path ], (struct) => {
                        if (struct.target !== null) {
                            eventImpl.eventPhase = EVENT_PHASE.AT_TARGET;
                        } else {
                            if (!eventImpl.bubbles) {
                                return [ step.continue ]
                            }
                            eventImpl.eventPhase = EVENT_PHASE.BUBBLING_PHASE;
                        }
                        _invokeEventListeners(struct, eventImpl, "bubbling", legacyOutputDidListenersThrowFlag, trace, step());
                    })
                })
            }
        }, () => {
            eventImpl.eventPhase = EVENT_PHASE.NONE;

            eventImpl.currentTarget = null;
            eventImpl._path = [];
            eventImpl._dispatchFlag = false;
            eventImpl._stopPropagationFlag = false;
            eventImpl._stopImmediatePropagationFlag = false;

            if (clearTargets) {
                eventImpl.target = null;
                eventImpl.relatedTarget = null;
            }

            if (activationTarget) {
                if (!eventImpl._canceledFlag) {
                    activationTarget._activationBehavior(eventImpl);
                } else if (activationTarget._legacyCanceledActivationBehavior) {
                    activationTarget._legacyCanceledActivationBehavior();
                }
            }

            if (trace !== null) {
                trace.hook.disable()
            }

            return [ ! eventImpl._canceledFlag ]
        })
    })
}

module.exports = {
  implementation: EventTargetImpl
};

// https://dom.spec.whatwg.org/#concept-event-listener-invoke
const _invokeEventListeners = cadence((step, struct, eventImpl, phase, legacyOutputDidListenersThrowFlag, trace = null) => {
  const structIndex = eventImpl._path.indexOf(struct);
  for (let i = structIndex; i >= 0; i--) {
    const t = eventImpl._path[i];
    if (t.target) {
      eventImpl.target = t.target;
      break;
    }
  }

  eventImpl.relatedTarget = idlUtils.wrapperForImpl(struct.relatedTarget);

  if (eventImpl._stopPropagationFlag) {
    return;
  }

  eventImpl.currentTarget = idlUtils.wrapperForImpl(struct.item);

  const listeners = struct.item._eventListeners;
  _innerInvokeEventListeners(eventImpl, listeners, phase, struct.itemInShadowTree, legacyOutputDidListenersThrowFlag, trace, step())
})

// https://dom.spec.whatwg.org/#concept-event-listener-inner-invoke

const _innerInvokeEventListeners = cadence((step, eventImpl, listeners, phase, _itemInShadowTree, legacyOutputDidListenersThrowFlag, trace) => {
    const found = false

    const { type, target } = eventImpl
    const _wrapper = idlUtils.wrapperForImpl(target)

    if (!listeners || !listeners[type]) {
        return found
    }

    // Copy event listeners before iterating since the list can be modified during the iteration.
    const handlers = [...listeners[type]];

    step.forEach([ handlers ], (listener) => {
        const { capture, once, passive } = listener.options;
        if (
            (phase === "capturing" && !capture) ||
            (phase === "bubbling" && capture)
        ) {
            return [ step.continue ]
        }

        if (once) {
          listeners[type].splice(listeners[type].indexOf(listener), 1);
        }

        if (passive) {
            eventImpl._inPassiveListenerFlag = true;
        }

        try {
          listener.callback.call(eventImpl.currentTarget, eventImpl);
        } catch (error) {
            console.log(error.stack)
          if (legacyOutputDidListenersThrowFlag) {
            eventImpl._legacyOutputDidListenersThrowFlag = true
          }
        }

        eventImpl._inPassiveListenerFlag = false;

        if (trace !== null) {
            step.loop([], () => {
                return new Promise(resolve => resolve(1))
            }, () => {
                trace.map.delete(hooks.executionAsyncId())
                trace.map.delete(hooks.triggerAsyncId())
                const next = new Set(trace.map.keys())
                if (setEqual(trace.previous, next)) {
                    return [ step.break ]
                }
                trace.previous = next
            })
        }
    })
})

/**
 * Normalize the event listeners options argument in order to get always a valid options object
 * @param   {Object} options         - user defined options
 * @param   {Array} defaultBoolKeys  - boolean properties that should belong to the options object
 * @returns {Object} object containing at least the "defaultBoolKeys"
 */
function normalizeEventHandlerOptions(options, defaultBoolKeys) {
  const returnValue = {};

  // no need to go further here
  if (typeof options === "boolean" || options === null || typeof options === "undefined") {
    returnValue.capture = Boolean(options);
    return returnValue;
  }

  // non objects options so we typecast its value as "capture" value
  if (typeof options !== "object") {
    returnValue.capture = Boolean(options);
    // at this point we don't need to loop the "capture" key anymore
    defaultBoolKeys = defaultBoolKeys.filter(k => k !== "capture");
  }

  for (const key of defaultBoolKeys) {
    returnValue[key] = Boolean(options[key]);
  }

  return returnValue;
}

// https://dom.spec.whatwg.org/#concept-event-path-append
function appendToEventPath(eventImpl, target, targetOverride, relatedTarget, touchTargets, slotInClosedTree) {
  const itemInShadowTree = isNode(target) && isShadowRoot(nodeRoot(target));
  const rootOfClosedTree = isShadowRoot(target) && target.mode === "closed";

  eventImpl._path.push({
    item: target, itemInShadowTree, relatedTarget, rootOfClosedTree, slotInClosedTree, target: targetOverride, touchTargets
  });
}
