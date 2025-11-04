require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_count4");
	await harness(async () => {
		var db,
			ostore,
			t = async_test();

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(event) {
			db = event.target.result;
			ostore = db.createObjectStore("store", { keyPath: "pKey" });
			db.deleteObjectStore("store");
			assert_throws_dom("InvalidStateError", function onupgradeneeded() {
				ostore.count();
			});
			t.done();
		};
	});
});
