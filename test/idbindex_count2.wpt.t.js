require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbindex_count2");
	await harness(async () => {
		var db,
			t = async_test();

		var open_rq = createdb(t);

		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var store = db.createObjectStore("store", { autoIncrement: true });
			store.createIndex("index", "indexedProperty");

			for (let i = 0; i < 10; i++) {
				store.add({ indexedProperty: "data" + i });
			}
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var rq = db
				.transaction("store")
				.objectStore("store")
				.index("index")
				.count(IDBKeyRange.bound("data0", "data4"));

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result, 5);
				t.done();
			});
		};
	});
});
