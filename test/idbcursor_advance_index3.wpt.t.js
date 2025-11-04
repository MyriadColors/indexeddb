require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbcursor_advance_index3");
	await harness(async () => {
		var db,
			t = async_test(),
			records = [
				{ iKey: "indexKey_0", pKey: "primaryKey_0" },
				{ iKey: "indexKey_1", pKey: "primaryKey_1" },
			];

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var objStore = db.createObjectStore("test", { keyPath: "pKey" });

			objStore.createIndex("index", "iKey");

			for (let i = 0; i < records.length; i++) {
				objStore.add(records[i]);
			}
		};

		open_rq.onsuccess = function onsuccess(_e) {
			const cursor_rq = db
				.transaction("test")
				.objectStore("test")
				.index("index")
				.openCursor(undefined, "next");

			cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
				var cursor = e.target.result;

				assert_true(cursor !== null, "cursor exist");
				assert_throws_js(TypeError, function onsuccess() {
					cursor.advance(-1);
				});

				t.done();
			});
		};
	});
});
