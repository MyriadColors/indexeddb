require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbindex-multientry-arraykeypath");
	await harness(async () => {
		createdb(async_test()).onupgradeneeded = function onupgradeneeded(e) {
			var store = e.target.result.createObjectStore("store");

			assert_throws_dom("InvalidAccessError", function onupgradeneeded() {
				store.createIndex("actors", ["name"], { multiEntry: true });
			});

			this.done();
		};
	});
});
