require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbdatabase_deleteObjectStore2");
	await harness(async () => {
		var t = async_test(),
			open_rq = createdb(t);

		open_rq.onupgradeneeded = function onupgradeneeded(e) {
			var db = e.target.result,
				objStore = db.createObjectStore("delete_outside");

			e.target.transaction.oncomplete = t.step_func(function oncomplete(e) {
				assert_throws_dom("InvalidStateError", function oncomplete() {
					db.deleteObjectStore("delete_outside");
				});
				t.done();
			});
		};
	});
});
