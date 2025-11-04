require("proof")(5, async (okay) => {
	await require("./harness")(okay, "idbdatabase_createObjectStore10-emptyname");
	await harness(async () => {
		var db;

		var open_rq = createdb(async_test());
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var store = db.createObjectStore("");

			for (let i = 0; i < 5; i++) {
				store.add("object_" + i, i);
			}

			assert_equals(db.objectStoreNames[0], "", "db.objectStoreNames[0]");
			assert_equals(db.objectStoreNames.length, 1, "objectStoreNames.length");
		};

		open_rq.onsuccess = function onsuccess() {
			var store = db.transaction("").objectStore("");

			store.get(2).onsuccess = this.step_func(function onsuccess(_e) {
				assert_equals(e.target.result, "object_2");
				this.done();
			});

			assert_equals(db.objectStoreNames[0], "", "db.objectStoreNames[0]");
			assert_equals(db.objectStoreNames.length, 1, "objectStoreNames.length");
		};
	});
});
