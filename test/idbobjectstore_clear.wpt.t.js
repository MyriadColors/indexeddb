require("proof")(2, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_clear");
	await harness(async () => {
		var db,
			t = async_test();

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;
			var objStore = db.createObjectStore("store", { autoIncrement: true });

			objStore.add({ property: "data" });
			objStore.add({ something_different: "Yup, totally different" });
			objStore.add(1234);
			objStore.add([1, 2, 1234]);

			objStore.clear().onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result);
			});
		};

		open_rq.onsuccess = function onsuccess(_e) {
			var rq = db.transaction("store").objectStore("store").openCursor();

			rq.onsuccess = t.step_func(function onsuccess(_e) {
				assert_equals(e.target.result, null, "cursor");
				t.done();
			});
		};
	});
});
