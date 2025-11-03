import { implementation as IDBRequestImpl } from './IDBRequest-impl'

import { createEventAccessor } from './living/helpers/create-event-accessor'

class IDBOpenDBRequestImpl extends IDBRequestImpl {
    
/*
    toString () {
        return '[object IDBOpenDBRequest]'
    }
*/
}

createEventAccessor(IDBOpenDBRequestImpl.prototype, 'upgradeneeded')
createEventAccessor(IDBOpenDBRequestImpl.prototype, 'blocked')

export const implementation = IDBOpenDBRequestImpl
