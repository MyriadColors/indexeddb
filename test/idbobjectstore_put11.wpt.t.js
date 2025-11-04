require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_put11");
	await harness(async () => {
		var db,
			t = async_test(),
			record = { key: { value: 1 }, property: "data" };

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;

			var rq,
				objStore = db.createObjectStore("store", { keyPath: "key" });

			assert_throws_dom("DataError", function onupgradeneeded() {
				rq = objStore.put(record);
			});

			assert_equals(rq);
			t.done();
		};
	});
});
