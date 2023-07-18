import { humanizeTimeSpan } from '@/model/humanizeTimeSpan';

describe('humanizeTimeSpan', () => {
	const commentTime = '2023-05-03T15:00:53.072-04:00';

	test.each`
		currentTime                        | humanized
		${'2124-05-03T15:00:53.072-04:00'} | ${'101 years ago'}
		${'2025-05-03T15:00:53.072-04:00'} | ${'2 years ago'}
		${'2024-05-03T15:00:53.072-04:00'} | ${'1 year ago'}
		${'2024-04-03T15:00:53.072-04:00'} | ${'11 months ago'}
		${'2023-07-03T15:00:52.072-04:00'} | ${'2 months ago'}
		${'2023-06-03T15:00:53.072-04:00'} | ${'1 month ago'}
		${'2023-06-01T15:00:53.072-04:00'} | ${'4 weeks ago'}
		${'2023-05-17T15:00:53.072-04:00'} | ${'2 weeks ago'}
		${'2023-05-17T15:00:52.072-04:00'} | ${'1 week ago'}
		${'2023-05-09T15:00:53.072-04:00'} | ${'6 days ago'}
		${'2023-05-05T15:00:53.072-04:00'} | ${'2 days ago'}
		${'2023-05-04T15:00:53.072-04:00'} | ${'1 day ago'}
		${'2023-05-04T15:00:52.072-04:00'} | ${'23 hours ago'}
		${'2023-05-03T17:00:54.072-04:00'} | ${'2 hours ago'}
		${'2023-05-03T17:00:52.072-04:00'} | ${'1 hour ago'}
		${'2023-05-03T16:00:52.072-04:00'} | ${'59 minutes ago'}
		${'2023-05-03T15:02:53.072-04:00'} | ${'2 minutes ago'}
		${'2023-05-03T15:01:53.072-04:00'} | ${'1 minute ago'}
		${'2023-05-03T15:01:52.072-04:00'} | ${'59 seconds ago'}
		${'2023-05-03T15:00:55.072-04:00'} | ${'2 seconds ago'}
		${'2023-05-03T15:00:54.072-04:00'} | ${'1 second ago'}
		${'2023-05-03T15:00:53.072-04:00'} | ${'now'}
	`(
		'returns $humanized for a given comment timestamp',
		({
			currentTime,
			humanized,
		}: {
			currentTime: string;
			humanized: string;
		}) => {
			jest.useFakeTimers().setSystemTime(new Date(currentTime));
			expect(humanizeTimeSpan(commentTime)).toBe(humanized);
		}
	);
});
