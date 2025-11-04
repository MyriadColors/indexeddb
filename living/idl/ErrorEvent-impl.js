import { convert } from "./living/generated/ErrorEventInit";
import { implementation as EventImpl } from "./living/idl/Event-impl.js";

class ErrorEventImpl extends EventImpl {}
ErrorEventImpl.defaultInit = convert();

export const implementation = ErrorEventImpl;
