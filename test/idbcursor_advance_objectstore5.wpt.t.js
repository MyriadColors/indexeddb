require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbcursor_advance_objectstore5");
	await harness(async () => {
		let db,
			t = async_test(),
			records = [{ pKey: "primaryKey_0" }, { pKey: "primaryKey_1" }];

		const open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(event) {
			db = event.target.result;
			const objStore = db.createObjectStore("store", { keyPath: "pKey" });
			for (let i = 0; i < records.length; i++) {
				objStore.add(records[i]);
			}
			const rq = objStore.openCursor();
			rq.onsuccess = t.step_func(function onsuccess(event) {
				const cursor = event.target.result;
				assert_true(cursor instanceof IDBCursor, "cursor exist");

				db.deleteObjectStore("store");
				assert_throws_dom(
					"InvalidStateError",
					function onsuccess() {
						cursor.advance(1);
					},
					"If the cursor's source or effective object store has been deleted, the implementation MUST throw a DOMException of type InvalidStateError",
				);

				t.done();
			});
		};
	});
});
