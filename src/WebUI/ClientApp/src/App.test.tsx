import { App } from '@/App';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

jest.mock('@/utils');

test('renders learn react link', () => {
	render(<App />);
	const linkElement = screen.getByText(/command prompt in that directory/i);
	expect(linkElement).toBeInTheDocument();
});
