require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbindex_get4");
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
				.get(IDBKeyRange.bound("data4", "data7"));

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result.key, 4);
				assert_equals(e.target.result.indexedProperty, "data4");

				step_timeout(function onsuccess() {
					t.done();
				}, 4);
			});
		};
	});
});
