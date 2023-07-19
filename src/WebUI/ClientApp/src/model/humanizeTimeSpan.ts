const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;
const ONE_WEEK = ONE_DAY * 7;
// this implementation does not consider month with different length
// but the approach should be good enough for brought estimations
// how much time has passed, since a comment has been created
const ONE_MONTH = ONE_DAY * 30;
const ONE_YEAR = ONE_DAY * 365;

export const humanizeTimeSpan = (date: string): string => {
	const differenceInMilliseconds =
		new Date().getTime() - new Date(date).getTime();

	const pluralHelper = (divider: number, readableSpan: string): string => {
		const value = Math.floor(differenceInMilliseconds / divider);
		return `${value} ${readableSpan}${value > 1 ? 's' : ''} ago`;
	};

	if (differenceInMilliseconds >= ONE_YEAR)
		return pluralHelper(ONE_YEAR, 'year');

	if (differenceInMilliseconds >= ONE_MONTH)
		return pluralHelper(ONE_MONTH, 'month');

	if (differenceInMilliseconds >= ONE_WEEK)
		return pluralHelper(ONE_WEEK, 'week');

	if (differenceInMilliseconds >= ONE_DAY) return pluralHelper(ONE_DAY, 'day');

	if (differenceInMilliseconds >= ONE_HOUR)
		return pluralHelper(ONE_HOUR, 'hour');

	if (differenceInMilliseconds >= ONE_MINUTE)
		return pluralHelper(ONE_MINUTE, 'minute');

	if (differenceInMilliseconds >= ONE_SECOND)
		return pluralHelper(ONE_SECOND, 'second');

	return 'now';
};

export const toIsoString = (date: Date): string => {
	const timezone = -date.getTimezoneOffset();
	const polarity = timezone >= 0 ? '+' : '-';
	const pad = (num: number): string => `${num < 10 ? '0' : ''}${num}`;

	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
		date.getDate()
	)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
		date.getSeconds()
	)}${polarity}${pad(Math.floor(Math.abs(timezone) / 60))}:${pad(
		Math.abs(timezone) % 60
	)}`;
};
