import * as glob from "glob";
import * as Mocha from "mocha";
import * as path from "path";

function setupNyc() {
	const NYC = require("nyc");
	// create an nyc instance, config here is the same as your package.json
	const nyc = new NYC({
		all: true,
		cache: false,
		cwd: path.join(__dirname, "..", "..", ".."),
		exclude: [
			"**/*.d.ts",
			"**/**.test.js",
		],
		extension: [
			".ts",
			".tsx",
		],
		hookRequire: true,
		hookRunInContext: true,
		hookRunInThisContext: true,
		instrument: true,
		reporter: ["text", "html", "cobertura"],
		require: [
			"ts-node/register",
			"source-map-support/register",
		],
		sourceMap: true,
	});
	nyc.reset();
	nyc.wrap();
	return nyc;
}

export function run(): Promise<void> {
	// tslint:disable-next-line
	let nyc = setupNyc(); // "const" causes coverage report error

	// Create the mocha test
	const mocha = new Mocha({
		color: true,
		reporter: "mocha-junit-reporter",
		reporterOptions: {
			mochaFile: "../../out/coverage/test-results.xml",
		},
		timeout: 15000,
		ui: "tdd",
	});

	const testsRoot = path.resolve(__dirname, "..");
	return new Promise((c, e) => {
		glob("**/**.test.js", { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

			// Add files to the test suite
			files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run((failures) => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						if (nyc) {
							nyc.writeCoverageFile();
							nyc.report();
						}
						c();
					}
				});
			} catch (err) {
				// tslint:disable-next-line: no-console
				console.error(err);
				e(err);
			}
		});
	});

}
