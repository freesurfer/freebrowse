import { useState, useEffect } from 'react';
import { WeatherForecast, WeatherForecastClient } from '../app/web-api-client';

export const FetchData = () => {
	const [loading, setLoading] = useState(true);
	const [forecasts, setForecasts] = useState([] as WeatherForecast[]);

	useEffect(() => {
		async function populateWeatherData() {
			const client = new WeatherForecastClient(import.meta.env.VITE_API_URL);
			const data = await client.get();
			setForecasts(data);
			setLoading(false);
		}

		populateWeatherData();
	}, []);

	function renderForecastsTable(forecasts: WeatherForecast[]) {
		const renderRow = (forecast: WeatherForecast) => (
			<>
				{' '}
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
					{forecasts.map((forecast: WeatherForecast, index: any) =>
						index % 2 ? (
							<tr className="border-b" key={index}>
								{renderRow(forecast)}
							</tr>
						) : (
							<tr className="border-b bg-gray-100" key={index}>
								{renderRow(forecast)}
							</tr>
						)
					)}
				</tbody>
			</table>
		);
	}

	return (
		<div className="px-6 py-4">
			<h1 className="mb-1 text-xl font-medium" id="tableLabel">
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
