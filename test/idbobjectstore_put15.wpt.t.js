require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_put15");
	await harness(async () => {
		var db,
			t = async_test();

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(event) {
			db = event.target.result;
			db.createObjectStore("store", { keyPath: "pKey" });
		};

		open_rq.onsuccess = function onsuccess(event) {
			var txn = db.transaction("store");
			var ostore = txn.objectStore("store");
			t.step(function onsuccess() {
				assert_throws_dom("ReadOnlyError", function onsuccess() {
					ostore.put({ pKey: "primaryKey_0" });
				});
			});
			t.done();
		};
	});
});
