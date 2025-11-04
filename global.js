import jsGlobals from "jsdom/lib/jsdom/browser/js-globals.json";

const jsGlobalEntriesToInstall = Object.entries(jsGlobals).filter(
	([name]) => name in global,
);

export function add(globalObject) {
	for (const [globalName, globalPropDesc] of jsGlobalEntriesToInstall) {
		const propDesc = { ...globalPropDesc, value: global[globalName] };
		Object.defineProperty(globalObject, globalName, propDesc);
	}
}
