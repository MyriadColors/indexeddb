require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_delete3");
	await harness(async () => {
		var db,
			t = async_test(),
			record = { property: "data", test: { obj: { key: 1 } } };

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;

			var objStore = db.createObjectStore("test", { keyPath: "test.obj.key" });
			objStore.add(record);
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var delete_rq = db
				.transaction("test", "readwrite")
				.objectStore("test")
				.delete(record.test.obj.key);

			delete_rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result);

				e.target.transaction.oncomplete = t.step_func(VerifyRecordRemoved);
			});
		};

		function VerifyRecordRemoved() {
			var rq = db
				.transaction("test")
				.objectStore("test")
				.get(record.test.obj.key);

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result);
				t.done();
			});
		}
	});
});
