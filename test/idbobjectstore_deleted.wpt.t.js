require("proof")(13, async (okay) => {
	await require("./harness")(okay, "idbobjectstore_deleted");
	await harness(async () => {
		var db,
			add_success = false,
			t = async_test();

		var open_rq = createdb(t);
		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			db = e.target.result;

			var objStore = db.createObjectStore("store", { autoIncrement: true });
			assert_equals(db.objectStoreNames[0], "store", "objectStoreNames");

			var rq_add = objStore.add(1);
			rq_add.onsuccess = function onsuccess() {
				add_success = true;
			};
			rq_add.onerror = fail(t, "rq_add.error");

			objStore.createIndex("idx", "a");
			db.deleteObjectStore("store");
			assert_equals(
				db.objectStoreNames.length,
				0,
				"objectStoreNames.length after delete",
			);

			const exc = "InvalidStateError";
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.add(2);
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.put(3);
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.get(1);
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.clear();
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.count();
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.delete(1);
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.openCursor();
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.index("idx");
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.deleteIndex("idx");
			});
			assert_throws_dom(exc, function onupgradeneeded() {
				objStore.createIndex("idx2", "a");
			});
		};

		open_rq.onsuccess = function onsuccess() {
			assert_true(add_success, "First add was successful");
			t.done();
		};
	});
});
