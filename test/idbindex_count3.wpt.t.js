require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbindex_count3");
	await harness(async () => {
		var db;

		createdb(async_test()).onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;

			var store = db.createObjectStore("store", { autoIncrement: true });
			store.createIndex("myindex", "idx");

			for (let i = 0; i < 10; i++) {
				store.add({ idx: "data_" + (i % 2) });
			}

			store.index("myindex").count("data_0").onsuccess = this.step_func(
				function onsuccess(_e) {
					assert_equals(e.target.result, 5, "count(data_0)");
					this.done();
				},
			);
		};
	});
});
