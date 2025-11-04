require("proof")(1, async (okay) => {
	await require("./harness")(okay, "idbfactory_open");
	await harness(async () => {
		var open_rq = createdb(async_test(), undefined, 9);

		open_rq.onupgradeneeded = function onupgradeneeded(e) {};
		open_rq.onsuccess = function onsuccess(_e) {
			assert_equals(e.target.source, null, "source");
			this.done();
		};
	});
});
