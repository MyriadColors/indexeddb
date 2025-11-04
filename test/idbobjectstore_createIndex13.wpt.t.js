require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_createIndex13");
	await harness(async () => {
		var db,
			t = async_test();

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(event) {
			db = event.target.result;
			db.createObjectStore("store");
		};

		open_rq.onsuccess = function onsuccess(event) {
			var txn = db.transaction("store", "readwrite");
			var ostore = txn.objectStore("store");
			t.step(function onsuccess() {
				assert_throws_dom("InvalidStateError", function onsuccess() {
					ostore.createIndex("index", "indexedProperty");
				});
			});
			t.done();
		};
	});
});
