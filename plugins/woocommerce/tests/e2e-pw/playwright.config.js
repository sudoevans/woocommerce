const { devices } = require( '@playwright/test' );
require( 'dotenv' ).config( { path: __dirname + '/.env' } );

const {
	ALLURE_RESULTS_DIR,
	BASE_URL,
	CI,
	DEFAULT_TIMEOUT_OVERRIDE,
	E2E_MAX_FAILURES,
	PLAYWRIGHT_HTML_REPORT,
	REPEAT_EACH,
} = process.env;

const reporter = [
	[ 'list' ],
	[
		'allure-playwright',
		{
			outputFolder:
				ALLURE_RESULTS_DIR ??
				'./tests/e2e-pw/test-results/allure-results',
			detail: true,
			suiteTitle: true,
		},
	],
	[
		'json',
		{ outputFile: `./test-results/test-results-${ Date.now() }.json` },
	],
];

if ( process.env.CI ) {
	reporter.push( [ 'github' ] );
	reporter.push( [ 'buildkite-test-collector/playwright/reporter' ] );
} else {
	reporter.push( [
		'html',
		{
			outputFolder:
				PLAYWRIGHT_HTML_REPORT ?? './test-results/playwright-report',
			open: 'on-failure',
		},
	] );
}

const config = {
	timeout: DEFAULT_TIMEOUT_OVERRIDE
		? Number( DEFAULT_TIMEOUT_OVERRIDE )
		: 120 * 1000,
	expect: { timeout: 20 * 1000 },
	outputDir: './test-results/results-data',
	globalSetup: require.resolve( './global-setup' ),
	globalTeardown: require.resolve( './global-teardown' ),
	testDir: 'tests',
	retries: CI ? 2 : 0,
	repeatEach: REPEAT_EACH ? Number( REPEAT_EACH ) : 1,
	workers: 1,
	reportSlowTests: { max: 5, threshold: 30 * 1000 }, // 30 seconds threshold
	reporter,
	maxFailures: E2E_MAX_FAILURES ? Number( E2E_MAX_FAILURES ) : 0,
	use: {
		baseURL: BASE_URL ?? 'http://localhost:8086',
		screenshot: { mode: 'only-on-failure', fullPage: true },
		stateDir: 'tests/e2e-pw/.state/',
		trace: 'retain-on-failure',
		video: 'retain-on-failure',
		viewport: { width: 1280, height: 720 },
		actionTimeout: 20 * 1000,
		navigationTimeout: 20 * 1000,
	},
	projects: [
		{
			name: 'default',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
		{
			name: 'Gutenberg',
			use: { ...devices[ 'Desktop Chrome' ] },
			testIgnore:
				/.*smoke-tests\/*|.*js-file-monitor\/*|.*admin-tasks\/*|.*activate-and-setup\/*|.*admin-analytics\/*|.*admin-marketing\/*/,
		},
	],
};

module.exports = config;
