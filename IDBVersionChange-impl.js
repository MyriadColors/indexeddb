import { implementation as EventImpl } from './living/idl/Event-impl.js';
import { convert } from './living/generated/IDBVersionChangeEventInit';

class IDBVersionChangeEventImpl extends EventImpl {
    constructor (globalObject, args, privateData) {
        super(globalObject, args, privateData)
        const [type, eventInitDict = this.constructor.defaultInit] = args;
        this.newVersion = eventInitDict.newVersion
        this.oldVersion = eventInitDict.oldVersion
        this.type = type
    }
}
IDBVersionChangeEventImpl.defaultInit = convert(undefined);

export const implementation = IDBVersionChangeEventImpl;
