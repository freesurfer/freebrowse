import { useState, useEffect } from 'react';
import * as WebApi from '../app/web-api-client';
import { getApiUrl } from '@/utils';

export const FetchData = (): React.ReactElement => {
	const [loading, setLoading] = useState(true);
	const [forecasts, setForecasts] = useState([] as WebApi.WeatherForecast[]);

	useEffect(() => {
		async function populateWeatherData(): Promise<void> {
			const client = new WebApi.WeatherForecastClient(getApiUrl());
			const data = await client.get();
			setForecasts(data);
			setLoading(false);
		}

		void populateWeatherData();
	}, []);

	function renderForecastsTable(
		forecasts: WebApi.WeatherForecast[]
	): JSX.Element {
		const renderRow = (forecast: WebApi.WeatherForecast): JSX.Element => (
			<>
				<td className="p-2">{forecast.date?.toString()}</td>
				<td className="p-2">{forecast.temperatureC}</td>
				<td className="p-2">{forecast.temperatureF}</td>
				<td className="p-2">{forecast.summary}</td>
			</>
		);

		return (
			<table className="mt-4 w-full table-auto" aria-labelledby="tableLabel">
				<thead>
					<tr className="border-b">
						<th className="p-2 text-left">Date</th>
						<th className="p-2 text-left">Temp. (C)</th>
						<th className="p-2 text-left">Temp. (F)</th>
						<th className="p-2 text-left">Summary</th>
					</tr>
				</thead>
				<tbody>
					{forecasts.map((forecast: WebApi.WeatherForecast, index: number) => {
						const mod2 = index % 2;
						const isOdd = mod2 === 1;

						if (isOdd)
							return (
								<tr className="border-b" key={index}>
									{renderRow(forecast)}
								</tr>
							);

						return (
							<tr className="border-b bg-gray-100" key={index}>
								{renderRow(forecast)}
							</tr>
						);
					})}
				</tbody>
			</table>
		);
	}

	return (
		<div className="px-6 py-4">
			<h1 className="mb-1 text-3xl font-medium" id="tableLabel">
				Weather forecast
			</h1>
			<p>This component demonstrates fetching data from the server.</p>
			{loading ? (
				<p className="mt-4">
					<em>Loading...</em>
				</p>
			) : (
				renderForecastsTable(forecasts)
			)}
		</div>
	);
};
