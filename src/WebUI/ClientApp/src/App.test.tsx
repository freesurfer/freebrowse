import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '@/App';

jest.mock('@/utils');

test('renders learn react link', () => {
	render(<App />);
	const linkElement = screen.getByText(/command prompt in that directory/i);
	expect(linkElement).toBeInTheDocument();
});
