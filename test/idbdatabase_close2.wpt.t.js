require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbdatabase_close2");
	await harness(async () => {
		var db;
		var blocked_fired = false;
		var versionchange_fired = false;
		var t = async_test();
		var open_rq = createdb(t);

		open_rq.onupgradeneeded = t.step_func(function onupgradeneeded() {});
		open_rq.onsuccess = t.step_func(function onsuccess(_e) {
			db = e.target.result;

			db.onversionchange = t.step_func(function onversionchange(e) {
				versionchange_fired = true;
			});

			var rq = window.indexedDB.deleteDatabase(db.name);
			rq.onblocked = t.step_func(function onblocked(e) {
				blocked_fired = true;
				db.close();
			});
			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_true(versionchange_fired, "versionchange event fired");
				assert_true(blocked_fired, "block event fired");
				t.done();
			});
			rq.onerror = fail(t, "Unexpected database deletion error");
		});
	});
});
