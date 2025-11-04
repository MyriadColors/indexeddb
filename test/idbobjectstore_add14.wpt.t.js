require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_add14");
	await harness(async () => {
		var db,
			t = async_test(),
			record = { indexedProperty: { property: "data" }, key: 1 };

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;

			var rq,
				objStore = db.createObjectStore("store", { keyPath: "key" });

			objStore.createIndex("index", "indexedProperty");

			rq = objStore.add(record);

			assert_true(rq instanceof IDBRequest);
			rq.onsuccess = function onsuccess() {
				t.done();
			};
		};
	});
});
