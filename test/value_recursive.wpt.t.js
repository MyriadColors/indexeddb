require("proof")(3, async (okay) => {
	await require("./harness")(okay, "value_recursive");
	await harness(async () => {
		function recursive_value(desc, value) {
			var db,
				t = async_test(`${document.title} - ${desc}`);

			createdb(t).onupgradeneeded = function onupgradeneeded(e) {
				db = e.target.result;
				db.createObjectStore("store").add(value, 1);

				e.target.onsuccess = t.step_func(function onsuccess(_e) {
					db.transaction("store").objectStore("store").get(1).onsuccess =
						t.step_func(function onsuccess(_e) {
							try {
								const fresh_value = JSON.stringify(value);
								assert_unreached(
									"Testcase is written wrongly, must supply something recursive (that JSON won't stringify).",
								);
							} catch (error) {
								if (error.name === "TypeError") {
									try {
										JSON.stringify(error.target.result);
										assert_unreached(
											"Expected a non-JSON-serializable value back, didn't get that.",
										);
									} catch {
										okay(true);
										t.done();
										return;
									}
								} else {
									throw error;
								}
							}
						});
				});
			};
		}

		var recursive = [];
		recursive.push(recursive);
		recursive_value("array directly contains self", recursive);

		var recursive2 = [];
		recursive2.push([recursive2]);
		recursive_value("array indirectly contains self", recursive2);

		var recursive3 = [recursive];
		recursive_value("array member contains self", recursive3);
	});
});
