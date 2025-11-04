require("proof")(17, (okay) => {
	const Transactor = require("../transactor");

	{
		const transactor = new Transactor();
		const shifter = transactor.queue.sync.shifter();
		transactor.transaction("request", ["chairs"], true);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["chairs"],
				readOnly: true,
			},
			"started",
		);
		transactor.transaction("request", ["chairs", "locations"], true);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["chairs", "locations"],
				readOnly: true,
			},
			"started",
		);
		transactor.transaction("blocked write", ["locations"], false);
		okay(shifter.shift(), null, "blocked write");
		transactor.complete(["chairs", "locations"]);
		okay(
			shifter.shift(),
			{
				extra: "blocked write",
				method: "transact",
				names: ["locations"],
				readOnly: false,
			},
			"unblocked write",
		);
	}
	{
		const transactor = new Transactor();
		const shifter = transactor.queue.sync.shifter();
		transactor.transaction("request", ["a"], false);
		transactor.transaction("request", ["a", "b"], false);
		transactor.transaction("request", ["b", "c"], true);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["a"],
				readOnly: false,
			},
			"started",
		);
		okay(shifter.shift(), null, "blocked write");
		transactor.complete(["a"]);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["a", "b"],
				readOnly: false,
			},
			"started",
		);
		transactor.complete(["a", "b"]);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["b", "c"],
				readOnly: true,
			},
			"started",
		);
	}
	{
		const transactor = new Transactor();
		const shifter = transactor.queue.sync.shifter();
		transactor.transaction("request", ["a", "c"], true);
		transactor.transaction("request", ["a", "b"], true);
		transactor.transaction("request", ["a", "c"], false);
		transactor.transaction("request", ["a"], true);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["a", "c"],
				readOnly: true,
			},
			"started",
		);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["a", "b"],
				readOnly: true,
			},
			"parallel read",
		);
		okay(shifter.shift(), null, "blocked write");
		transactor.complete(["a", "b"]);
		okay(shifter.shift(), null, "still blocked write");
		transactor.complete(["a", "c"]);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["a", "c"],
				readOnly: false,
			},
			"still blocked write",
		);
		okay(shifter.shift(), null, "blocked read");
		transactor.complete(["a", "c"]);
		okay(
			shifter.shift(),
			{
				extra: "request",
				method: "transact",
				names: ["a"],
				readOnly: true,
			},
			"unblocked read",
		);
		okay(shifter.shift(), null, "empty");
	}
	{
		const transactor = new Transactor();
		const shifter = transactor.queue.sync.shifter();
		transactor.transaction("request", ["a"], true);
		transactor.transaction("request", ["a"], true);
		okay(
			[shifter.shift(), shifter.shift(), shifter.shift()],
			[
				{
					extra: "request",
					method: "transact",
					names: ["a"],
					readOnly: true,
				},
				{
					extra: "request",
					method: "transact",
					names: ["a"],
					readOnly: true,
				},
				null,
			],
			"parallel read",
		);
		transactor.complete(["a"]);
		transactor.complete(["a"]);
	}
});
