import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const Counter = (): React.ReactElement => {
	const [currentCount, setCurrentCount] = useState(0);
	const { t } = useTranslation();

	function incrementCounter(): void {
		setCurrentCount(currentCount + 1);
	}

	return (
		<div className="px-6 py-4">
			<h1 className="mb-1 text-3xl font-medium">{t('counter_title')}</h1>

			<p>{t('counter_description')}</p>

			<p className="mt-4">
				{t('counter_state')}: <strong>{currentCount}</strong>
			</p>

			<button
				className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
				onClick={incrementCounter}
			>
				{t('counter_button_increment')}
			</button>
		</div>
	);
};
