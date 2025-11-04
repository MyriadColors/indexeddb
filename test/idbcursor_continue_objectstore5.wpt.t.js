require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbcursor_continue_objectstore5");
	await harness(async () => {
		var db,
			t = async_test(),
			records = [{ pKey: "primaryKey_0" }, { pKey: "primaryKey_1" }];

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var objStore = db.createObjectStore("test", { keyPath: "pKey" });

			for (let i = 0; i < records.length; i++) {
				objStore.add(records[i]);
			}
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var cursor_rq = db.transaction("test").objectStore("test").openCursor();

			cursor_rq.onsuccess = t.step_func(function onsuccess(_e) {
				var cursor = e.target.result;
				assert_true(cursor instanceof IDBCursor, "cursor exists");

				e.target.transaction.abort();
				assert_throws_dom(
					"TransactionInactiveError",
					function onsuccess() {
						cursor.continue();
					},
					"Calling continue() should throws an exception TransactionInactiveError when the transaction is not active.",
				);

				t.done();
			});
		};
	});
});
