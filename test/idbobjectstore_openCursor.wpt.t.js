require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_openCursor");
	await harness(async () => {
		var db;
		var open_rq = createdb(async_test());

		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var store = db.createObjectStore("store");

			for (var i = 0; i < 100; i++) {
				store.add("record_" + i, i);
			}
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var count = 0;
			var txn = db.transaction("store");

			txn.objectStore("store").openCursor().onsuccess = this.step_func(
				function onsuccess(_e) {
					if (e.target.result) {
						count += 1;
						e.target.result.continue();
					}
				},
			);

			txn.oncomplete = this.step_func(function oncomplete() {
				assert_equals(count, 100);
				this.done();
			});
		};
	});
});
