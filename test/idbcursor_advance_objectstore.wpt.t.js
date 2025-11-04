require("proof")(3, async (okay) => {
	await require("./harness")(okay, "idbcursor_advance_objectstore");
	await harness(async () => {
		var db,
			count = 0,
			t = async_test(),
			records = [
				{ pKey: "primaryKey_0" },
				{ pKey: "primaryKey_1" },
				{ pKey: "primaryKey_2" },
				{ pKey: "primaryKey_3" },
			];

		const open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			const store = db.createObjectStore("test", { keyPath: "pKey" });

			for (let i = 0; i < records.length; i++) {
				store.add(records[i]);
			}
		};

		open_rq.onsuccess = function onsuccess(_e) {
			const cursor_rq = db.transaction("test").objectStore("test").openCursor();

			cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
				const cursor = e.target.result;
				assert_true(cursor instanceof IDBCursor);

				switch (count) {
					case 0: {
						count += 3;
						cursor.advance(3);
						break;
					}
					case 3: {
						assert_equals(
							cursor.value.pKey,
							records[count].pKey,
							"cursor.value.pKey",
						);
						t.done();
						break;
					}
					default: {
						assert_unreached("unexpected count");
						break;
					}
				}
			});
		};
	});
});
