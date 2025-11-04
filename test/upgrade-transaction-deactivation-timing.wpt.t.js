import { proof } from "proof";
import { harness, indexeddb_test } from "./harness";

proof(6, async (okay) => {
	await harness(okay, "upgrade-transaction-deactivation-timing");
	await harness(async () => {
		indexeddb_test(
			(_t, db, tx) => {
				db.createObjectStore("store");
				assert_true(
					is_transaction_active(tx, "store"),
					"Transaction should be active in upgradeneeded callback",
				);
			},
			(t) => {
				t.done();
			},
			"Upgrade transactions are active in upgradeneeded callback",
		);

		indexeddb_test(
			(t, db, tx) => {
				db.createObjectStore("store");
				assert_true(
					is_transaction_active(tx, "store"),
					"Transaction should be active in upgradeneeded callback",
				);

				Promise.resolve().then(
					t.step_func(() => {
						assert_true(
							is_transaction_active(tx, "store"),
							"Transaction should be active in microtask checkpoint",
						);
					}),
				);
			},
			(t) => {
				t.done();
			},
			"Upgrade transactions are active in upgradeneeded callback and microtasks",
		);

		indexeddb_test(
			(t, db, tx) => {
				db.createObjectStore("store");
				const release_tx = keep_alive(tx, "store");

				setTimeout(
					t.step_func(() => {
						assert_false(
							is_transaction_active(tx, "store"),
							"Transaction should be inactive in next task",
						);
						release_tx();
					}),
					0,
				);
			},
			(t) => {
				t.done();
			},
			"Upgrade transactions are deactivated before next task",
		);
	});
});
