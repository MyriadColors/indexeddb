require("proof")(18, async (okay) => {
	await require("./harness")(okay, "idbfactory_open9");
	await harness(async () => {
		function should_throw(val, name) {
			if (!name) {
				name = typeof val === "object" && val ? "object" : format_value(val);
			}
			test(
				() => {
					assert_throws_js(TypeError, () => {
						window.indexedDB.open("test", val);
					});
				},
				"Calling open() with version argument " +
					name +
					" should throw TypeError.",
			);
		}

		should_throw(-1);
		should_throw(-0.5);
		should_throw(0);
		should_throw(0.5);
		should_throw(0.8);
		should_throw(0x20_00_00_00_00_00_00); // Number.MAX_SAFE_INTEGER + 1
		should_throw(NaN);
		should_throw(Infinity);
		should_throw(-Infinity);
		should_throw("foo");
		should_throw(null);
		should_throw(false);

		should_throw({
			toString: function toString() {
				assert_unreached(
					"toString should not be called for ToPrimitive [Number]",
				);
			},
			valueOf: function valueOf() {
				return 0;
			},
		});
		should_throw(
			{
				toString: function toString() {
					return 0;
				},
				valueOf: function valueOf() {
					return {};
				},
			},
			"object (second)",
		);
		should_throw(
			{
				toString: function toString() {
					return {};
				},
				valueOf: function valueOf() {
					return {};
				},
			},
			"object (third)",
		);

		/* Valid */

		function should_work(val, expected_version) {
			var name = format_value(val);
			var dbname = "test-db-does-not-exist";
			async_test(
				(t) => {
					window.indexedDB.deleteDatabase(dbname);
					var rq = window.indexedDB.open(dbname, val);
					rq.onupgradeneeded = t.step_func(function onupgradeneeded() {
						var db = rq.result;
						assert_equals(db.version, expected_version, "version");
						rq.transaction.abort();
					});
					rq.onsuccess = t.unreached_func("open should fail");
					rq.onerror = t.step_func(function onerror() {
						t.done();
					});
				},
				"Calling open() with version argument " + name + " should not throw.",
			);
		}

		should_work(1.5, 1);
		should_work(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER); // 0x20000000000000 - 1
		should_work(undefined, 1);
	});
});
