import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RetirementCalculator from './RetirementInflationCalculator';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock URL.createObjectURL and related functions
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('RetirementCalculator', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    // Reset document.body for each test
    document.body.innerHTML = '';
  });

  test('renders calculator with default values', () => {
    render(<RetirementCalculator />);
    
    expect(screen.getByText('Retirement Calculator')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // Current age
    expect(screen.getByDisplayValue('60')).toBeInTheDocument(); // Retirement age
    expect(screen.getByDisplayValue('100000')).toBeInTheDocument(); // Desired income
  });

  test('validates input ranges', async () => {
    render(<RetirementCalculator />);
    
    const currentAgeInput = screen.getByDisplayValue('20');
    fireEvent.change(currentAgeInput, { target: { value: '150' } });
    
    await waitFor(() => {
      expect(screen.getByText('Age must be between 18 and 120')).toBeInTheDocument();
    });
  });

  test('validates retirement age is after current age', async () => {
    render(<RetirementCalculator />);
    
    const retirementAgeInput = screen.getByDisplayValue('60');
    fireEvent.change(retirementAgeInput, { target: { value: '19' } });
    
    await waitFor(() => {
      expect(screen.getByText('Retirement age must be after current age')).toBeInTheDocument();
    });
  });

  test('calculates results with valid inputs', async () => {
    render(<RetirementCalculator />);
    
    // Wait for initial calculation
    await waitFor(() => {
      expect(screen.getByText('Your Retirement Outlook')).toBeInTheDocument();
    });
  });

  test('shows loading state during calculation', async () => {
    render(<RetirementCalculator />);
    
    const currentAgeInput = screen.getByDisplayValue('20');
    fireEvent.change(currentAgeInput, { target: { value: '25' } });
    
    // Should show loading briefly
    expect(screen.getByText('Calculating your retirement plan...')).toBeInTheDocument();
  });

  test('saves data to localStorage', async () => {
    render(<RetirementCalculator />);
    
    const currentAgeInput = screen.getByDisplayValue('20');
    fireEvent.change(currentAgeInput, { target: { value: '25' } });
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'retirementCalculatorData',
        expect.stringContaining('"currentAge":25')
      );
    });
  });

  test('loads data from localStorage on mount', () => {
    const savedData = {
      currentAge: 30,
      retirementAge: 65,
      lifeExpectancy: 95,
      desiredIncome: 120000,
      inflationScenario: 'moderate',
      customInflation: 2.5,
      expectedReturn: 8.0,
      returnDuringRetirement: 5.0,
      initialInvestment: 50000,
      annualContribution: 25000,
      taxRate: 24
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedData));
    
    render(<RetirementCalculator />);
    
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('65')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120000')).toBeInTheDocument();
  });

  test('exports plan data', async () => {
    // Mock document.createElement and related functions
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn(),
    };
    
    document.createElement = jest.fn(() => mockLink);
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
    
    render(<RetirementCalculator />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Export Plan')).toBeInTheDocument();
    });
    
    const exportButton = screen.getByText('Export Plan');
    fireEvent.click(exportButton);
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.click).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });

  test('toggles details view', async () => {
    render(<RetirementCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText('Show More Details')).toBeInTheDocument();
    });
    
    const detailsButton = screen.getByText('Show More Details');
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('Hide Details')).toBeInTheDocument();
  });

  test('displays withdrawal schedule when details are shown', async () => {
    render(<RetirementCalculator />);
    
    await waitFor(() => {
      expect(screen.getByText('Show More Details')).toBeInTheDocument();
    });
    
    const detailsButton = screen.getByText('Show More Details');
    fireEvent.click(detailsButton);
    
    expect(screen.getByText('Retirement Portfolio Projection')).toBeInTheDocument();
  });

  test('handles custom inflation rate', async () => {
    render(<RetirementCalculator />);
    
    const inflationSelect = screen.getByDisplayValue('Moderate (2.7%)');
    fireEvent.change(inflationSelect, { target: { value: 'custom' } });
    
    const customInflationInput = screen.getByPlaceholderText('Enter custom inflation rate');
    fireEvent.change(customInflationInput, { target: { value: '3.5' } });
    
    expect(customInflationInput).toHaveValue(3.5);
  });

  test('shows error for invalid custom inflation', async () => {
    render(<RetirementCalculator />);
    
    const inflationSelect = screen.getByDisplayValue('Moderate (2.7%)');
    fireEvent.change(inflationSelect, { target: { value: 'custom' } });
    
    const customInflationInput = screen.getByPlaceholderText('Enter custom inflation rate');
    fireEvent.change(customInflationInput, { target: { value: '60' } });
    
    await waitFor(() => {
      expect(screen.getByText('Custom inflation must be between -20% and 50%')).toBeInTheDocument();
    });
  });
}); 