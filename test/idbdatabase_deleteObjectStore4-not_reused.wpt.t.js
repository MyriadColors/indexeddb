require("proof")(6, async (okay) => {
	await require("./harness")(okay, "idbdatabase_deleteObjectStore4-not_reused");
	await harness(async () => {
		var t = async_test(),
			keys = [],
			open_rq = createdb(t);

		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			var db = e.target.result;

			var objStore = db.createObjectStore("resurrected", {
				autoIncrement: true,
				keyPath: "k",
			});
			objStore.add({ k: 5 }).onsuccess = function onsuccess(_e) {
				keys.push(e.target.result);
			};
			objStore.add({}).onsuccess = function onsuccess(_e) {
				keys.push(e.target.result);
			};
			objStore.createIndex("idx", "i");
			assert_true(objStore.indexNames.contains("idx"));
			assert_equals(objStore.keyPath, "k", "keyPath");

			db.deleteObjectStore("resurrected");

			var objStore2 = db.createObjectStore("resurrected", {
				autoIncrement: true,
			});
			objStore2.add("Unicorns'R'us").onsuccess = function onsuccess(_e) {
				keys.push(e.target.result);
			};
			assert_false(
				objStore2.indexNames.contains("idx"),
				"index exist on new objstore",
			);
			assert_equals(objStore2.keyPath, null, "keyPath");

			assert_throws_dom("NotFoundError", function onupgradeneeded() {
				objStore2.index("idx");
			});
		};

		open_rq.onsuccess = function onsuccess(_e) {
			assert_array_equals(keys, [5, 6, 1], "keys");
			t.done();
		};
	});
});
