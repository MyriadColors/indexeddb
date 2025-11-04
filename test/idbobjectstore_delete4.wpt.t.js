require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_delete4");
	await harness(async () => {
		var db,
			t = async_test(),
			key = 1,
			record = { property: "data" };

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;

			var objStore = db.createObjectStore("test");
			objStore.add(record, key);
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var delete_rq = db
				.transaction("test", "readwrite")
				.objectStore("test")
				.delete(key);

			delete_rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result);

				e.target.transaction.oncomplete = t.step_func(VerifyRecordRemoved);
			});
		};

		function VerifyRecordRemoved() {
			var rq = db.transaction("test").objectStore("test").get(key);

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result);
				t.done();
			});
		}
	});
});
