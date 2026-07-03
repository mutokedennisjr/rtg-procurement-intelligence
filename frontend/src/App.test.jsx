import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock child components to isolate App component tests
vi.mock('./GroupPriceMatrix', () => ({
  default: ({ reportingPeriod }) => <div data-testid="group-price-matrix">Group Price Matrix for {reportingPeriod}</div>,
}));

describe('App', () => {
  it('renders the main application layout and default view', () => {
    render(<App />);
    expect(screen.getByText('RTG Procurement')).toBeInTheDocument();
    expect(screen.getByText('Procurement Intelligence Center')).toBeInTheDocument();
    expect(screen.getByText('Analytics Overview')).toHaveClass('bg-[#d92332]');
    expect(screen.getByText(/Detailed Procurement Performance Metrics Matrix/)).toBeInTheDocument();
  });

  it('switches tabs when sidebar navigation buttons are clicked', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Switch to Group Price Matrix
    await user.click(screen.getByText('Group Price Matrix'));
    expect(screen.getByTestId('group-price-matrix')).toBeInTheDocument();
    expect(screen.getByText('Group Price Matrix')).toHaveClass('bg-[#d92332]');
    expect(screen.queryByText(/Detailed Procurement Performance Metrics Matrix/)).not.toBeInTheDocument();

    // Switch to Import Data Layer
    await user.click(screen.getByText('Import Data Layer'));
    expect(screen.getByText('📥 Regional Spreadsheet Intake Portal')).toBeInTheDocument();
    expect(screen.getByText('Import Data Layer')).toHaveClass('bg-[#d92332]');
    expect(screen.queryByTestId('group-price-matrix')).not.toBeInTheDocument();
  });

  it('updates target property when a new hotel is selected', async () => {
    render(<App />);
    const user = userEvent.setup();
    const hotelSelect = screen.getByRole('combobox');

    await user.selectOptions(hotelSelect, 'Victoria Falls Rainbow Hotel');
    expect(hotelSelect).toHaveValue('Victoria Falls Rainbow Hotel');
  });

  it('updates reporting period when a new month is selected', async () => {
    render(<App />);
    const user = userEvent.setup();
    const monthInput = screen.getByDisplayValue('2026-06');
    
    fireEvent.change(monthInput, { target: { value: '2026-08' } });
    expect(monthInput).toHaveValue('2026-08');
  });

  it('opens and closes the "Add New Record" modal', async () => {
    render(<App />);
    const user = userEvent.setup();

    await user.click(screen.getByText('+ Add New Record'));
    expect(screen.getByText('Append Matrix Intersect Data Layer')).toBeInTheDocument();
    
    await user.click(screen.getByText('✕'));
    expect(screen.queryByText('Append Matrix Intersect Data Layer')).not.toBeInTheDocument();
  });

  describe('SmartQuoteParser', () => {
    it('parses raw text input and displays extracted items', async () => {
      render(<App />);
      const user = userEvent.setup();
      const textArea = screen.getByPlaceholderText(/Example raw data to copy paste:/);
      const parseButton = screen.getByText('⚡ Execute Pattern Matcher');

      await user.type(textArea, 'Industrial Bleach 20L - $45.00
Washing Powder 25kg: US$85.50');
      await user.click(parseButton);
      
      expect(screen.getByText('Industrial Bleach 20L')).toBeInTheDocument();
      expect(screen.getByText('$45.00')).toBeInTheDocument();
      expect(screen.getByText('Washing Powder 25kg')).toBeInTheDocument();
      expect(screen.getByText('$85.50')).toBeInTheDocument();
      expect(screen.getByText('Engine successfully isolated 2 clean telemetry price vectors.')).toBeInTheDocument();
    });

    it('shows an error if raw text is empty when parsing', async () => {
        render(<App />);
        const user = userEvent.setup();
        const parseButton = screen.getByText('⚡ Execute Pattern Matcher');
  
        await user.click(parseButton);
        
        expect(screen.getByText('Pipeline source text is empty. Supply quote data strings first.')).toBeInTheDocument();
      });
  });

  it('allows manual entry of a new commodity record via modal', async () => {
    render(<App />);
    const user = userEvent.setup();

    // Open modal
    await user.click(screen.getByText('+ Add New Record'));

    // Fill form
    await user.type(screen.getByPlaceholderText('e.g. Industrial Bleach 20L'), 'Test Commodity');
    await user.selectOptions(screen.getByRole('combobox', { name: /UOM/i }), 'Unit');
    await user.type(screen.getByLabelText(/Unit Baseline Rate/i), '123.45');
    
    // Submit form
    await user.click(screen.getByText('Apply Layer Entry'));

    // Check if the new record is displayed in the main table (overview)
    // The table shows processed data, so we check for commodity name
    expect(screen.getByText('Test Commodity')).toBeInTheDocument();
    // And for the price
    expect(screen.getByText('$123.45')).toBeInTheDocument();
  });
});
