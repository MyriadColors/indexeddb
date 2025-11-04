require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_delete7");
	await harness(async () => {
		var db,
			ostore,
			t = async_test(),
			records = [{ pKey: "primaryKey_0" }, { pKey: "primaryKey_1" }];

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(event) {
			db = event.target.result;
			ostore = db.createObjectStore("store", { keyPath: "pKey" });
			db.deleteObjectStore("store");
			assert_throws_dom("InvalidStateError", function onupgradeneeded() {
				ostore.delete("primaryKey_0");
			});
			t.done();
		};
	});
});
