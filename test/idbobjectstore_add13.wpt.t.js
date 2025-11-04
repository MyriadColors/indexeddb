require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_add13");
	await harness(async () => {
		var db,
			t = async_test(),
			record = { property: "data" };

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;

			var rq,
				objStore = db.createObjectStore("store");

			assert_throws_dom("DataError", function onupgradeneeded() {
				rq = objStore.add(record, { value: 1 });
			});

			assert_equals(rq);
			t.done();
		};
	});
});
