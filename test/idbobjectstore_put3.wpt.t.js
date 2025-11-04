require("proof")(4, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_put3");
	await harness(async () => {
		var db,
			success_event,
			t = async_test(),
			record = { key: 1, property: "data" },
			record_put = { key: 1, more: ["stuff", 2], property: "changed" };

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var objStore = db.createObjectStore("store", { keyPath: "key" });
			objStore.put(record);

			var rq = objStore.put(record_put);
			rq.onerror = fail(t, "error on put");

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				success_event = true;
			});
		};

		open_rq.onsuccess = function onsuccess(_e) {
			assert_true(success_event);

			var rq = db.transaction("store").objectStore("store").get(1);

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				var rec = e.target.result;

				assert_equals(rec.key, record_put.key);
				assert_equals(rec.property, record_put.property);
				assert_array_equals(rec.more, record_put.more);

				t.done();
			});
		};
	});
});
