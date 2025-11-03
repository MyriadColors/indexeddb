import { implementation as EventImpl } from './living/idl/Event-impl.js';

import { convert } from './living/generated/ErrorEventInit';

class ErrorEventImpl extends EventImpl {}
ErrorEventImpl.defaultInit = convert();

export const implementation = ErrorEventImpl;
