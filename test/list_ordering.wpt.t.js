require("proof")(100, async (okay) => {
	await require("./harness")(okay, "list_ordering");
	await harness(async () => {
		function list_order(desc, unsorted, expected) {
			var objStore,
				db,
				t = async_test(`${document.title} - ${desc}`);

			var open_rq = createdb(t);
			open_rq.onupgradeneeded = function onupgradeneeded(e) {
				db = e.target.result;
				for (let i = 0; i < unsorted.length; i++) {
					objStore = db.createObjectStore(unsorted[i]);
				}

				assert_equals(
					db.objectStoreNames.length,
					expected.length,
					"objectStoreNames length",
				);
				for (let i = 0; i < expected.length; i++) {
					assert_equals(
						db.objectStoreNames[i],
						expected[i],
						`objectStoreNames[${i}]`,
					);
				}

				for (let i = 0; i < unsorted.length; i++) {
					objStore.createIndex(unsorted[i], "length");
				}

				assert_equals(
					objStore.indexNames.length,
					expected.length,
					"indexNames length",
				);
				for (let i = 0; i < expected.length; i++) {
					assert_equals(
						objStore.indexNames[i],
						expected[i],
						`indexNames[${i}]`,
					);
				}
			};

			open_rq.onsuccess = function onsuccess(_e) {
				assert_equals(
					db.objectStoreNames.length,
					expected.length,
					"objectStoreNames length",
				);
				for (let i = 0; i < expected.length; i++) {
					assert_equals(
						db.objectStoreNames[i],
						expected[i],
						`objectStoreNames[${i}]`,
					);
				}

				assert_equals(
					objStore.indexNames.length,
					expected.length,
					"indexNames length",
				);
				for (let i = 0; i < expected.length; i++) {
					assert_equals(
						objStore.indexNames[i],
						expected[i],
						`indexNames[${i}]`,
					);
				}

				t.done();
			};
		}

		list_order(
			"numbers",
			[123_456, -12_345, -123, 123, 1234, -1234, 0, 12_345, -123_456],
			[
				"-123",
				"-1234",
				"-12345",
				"-123456",
				"0",
				"123",
				"1234",
				"12345",
				"123456",
			],
		);

		list_order(
			"numbers 'overflow'",
			[9, 1, 1_000_000_000, 200_000_000_000_000_000],
			["1", "1000000000", "200000000000000000", "9"],
		);

		list_order(
			"lexigraphical string sort",
			["cc", "c", "aa", "a", "bb", "b", "ab", "", "ac"],
			["", "a", "aa", "ab", "ac", "b", "bb", "c", "cc"],
		);
	});
});
