import { useState, useEffect } from 'react';
import { WeatherForecast, WeatherForecastClient } from '../app/web-api-client';

export const FetchData = (props: any) => {
    const [loading, setLoading] = useState(true);
    const [forecasts, setForecasts] = useState([] as WeatherForecast[]);

    useEffect(() => {
        async function populateWeatherData() {
            const client = new WeatherForecastClient(process.env.REACT_APP_API_URL);
            const data = await client.get();
            setForecasts(data);
            setLoading(false);
        }

        populateWeatherData();
    }, []);

    function renderForecastsTable(forecasts: WeatherForecast[]) {
        return (
            <table className="table table-striped" aria-labelledby="tableLabel">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Temp. (C)</th>
                        <th>Temp. (F)</th>
                        <th>Summary</th>
                    </tr>
                </thead>
                <tbody>
                    {forecasts.map((forecast: WeatherForecast, index: any) =>
                        <tr key={index}>
                            <td>{forecast.date?.toString()}</td>
                            <td>{forecast.temperatureC}</td>
                            <td>{forecast.temperatureF}</td>
                            <td>{forecast.summary}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    }

    return (
        <div>
            <h1 id="tableLabel">Weather forecast</h1>
            <p>This component demonstrates fetching data from the server.</p>
            {loading
                ? <p><em>Loading...</em></p>
                : renderForecastsTable(forecasts)}
        </div>
    );
}
