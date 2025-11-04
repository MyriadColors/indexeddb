require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbindex_getKey2");
	await harness(async () => {
		var db,
			t = async_test(),
			records = [
				{ indexedProperty: "data", key: 1 },
				{ indexedProperty: "data", key: 2 },
				{ indexedProperty: "data", key: 3 },
			];

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var objStore = db.createObjectStore("test", { keyPath: "key" });
			objStore.createIndex("index", "indexedProperty");

			for (let i = 0; i < records.length; i++) {
				objStore.add(records[i]);
			}
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var rq = db
				.transaction("test")
				.objectStore("test")
				.index("index")
				.getKey("data");

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result, records[0].key);
				t.done();
			});
		};
	});
});
