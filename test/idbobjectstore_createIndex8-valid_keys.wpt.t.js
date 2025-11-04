require("proof")(8, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_createIndex8-valid_keys");
	await harness(async () => {
		var db,
			t = async_test(),
			now = new Date(),
			mar18 = new Date(1_111_111_111_111),
			ar = ["Yay", 2, -Infinity],
			num = 1337;

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var txn = e.target.transaction,
				objStore = db.createObjectStore("store", { keyPath: "key" });

			objStore.add({ i: now, key: "now" });
			objStore.add({ i: mar18, key: "mar18" });
			objStore.add({ i: ar, key: "array" });
			objStore.add({ i: num, key: "number" });

			var idx = objStore.createIndex("index", "i");

			idx.get(now).onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result.key, "now", "key");
				assert_equals(e.target.result.i.getTime(), now.getTime(), "getTime");
			});
			idx.get(mar18).onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result.key, "mar18", "key");
				assert_equals(e.target.result.i.getTime(), mar18.getTime(), "getTime");
			});
			idx.get(ar).onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result.key, "array", "key");
				assert_array_equals(e.target.result.i, ar, "array is the same");
			});
			idx.get(num).onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result.key, "number", "key");
				assert_equals(e.target.result.i, num, "number is the same");
			});
		};

		open_rq.onsuccess = function onsuccess() {
			t.done();
		};
	});
});
