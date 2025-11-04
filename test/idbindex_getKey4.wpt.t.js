require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbindex_getKey4");
	await harness(async () => {
		var db,
			t = async_test();

		var open_rq = createdb(t);

		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var store = db.createObjectStore("store", { keyPath: "key" });
			store.createIndex("index", "indexedProperty");

			for (let i = 0; i < 10; i++) {
				store.add({ indexedProperty: "data" + i, key: i });
			}
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var rq = db
				.transaction("store")
				.objectStore("store")
				.index("index")
				.getKey(IDBKeyRange.bound("data4", "data7"));

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result, 4);

				step_timeout(function onsuccess() {
					t.done();
				}, 4);
			});
		};
	});
});
