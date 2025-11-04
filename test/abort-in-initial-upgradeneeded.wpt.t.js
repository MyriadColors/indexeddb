require("proof")(7, async (okay) => {
	await require("./harness")(okay, "abort-in-initial-upgradeneeded");
	await harness(async () => {
		let db,
			open_rq = createdb(async_test(), undefined, 2);

		open_rq.onupgradeneeded = (event) => {
			db = event.target.result;
			assert_equals(db.version, 2);
			const transaction = event.target.transaction;
			transaction.oncomplete = fail(this, "unexpected transaction.complete");
			transaction.onabort = function onabort(e) {
				assert_equals(e.target.db.version, 0);
			};
			db.onabort = function onabort() {};

			transaction.abort();
		};

		open_rq.onerror = function onerror(e) {
			assert_equals(open_rq, e.target);
			assert_equals(e.target.result);
			assert_equals(e.target.error.name, "AbortError");
			assert_equals(db.version, 0);
			assert_equals(open_rq.transaction, null);
			this.done();
		};
	});
});
