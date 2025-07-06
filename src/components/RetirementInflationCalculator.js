import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Calendar, AlertCircle, Info } from 'lucide-react';

const RetirementInflationCalculator = () => {
  // State for inputs
  const [currentAge, setCurrentAge] = useState(29);
  const [retirementAge, setRetirementAge] = useState(50);
  const [endAge, setEndAge] = useState(90);
  const [desiredIncome, setDesiredIncome] = useState(100000);
  const [inflationScenario, setInflationScenario] = useState('base');
  const [customInflation, setCustomInflation] = useState(2.7);
  const [initialInvestment, setInitialInvestment] = useState(50000);
  const [annualContribution, setAnnualContribution] = useState(0);
  const [userSpecificOutcome, setUserSpecificOutcome] = useState(null);
  
  // State for results
  const [futureValues, setFutureValues] = useState([]);
  const [totalFunding, setTotalFunding] = useState({});
  const [requiredReturns, setRequiredReturns] = useState([]);
  const [expectedReturn, setExpectedReturn] = useState(9.6); // Default to S&P 500 historical average
  const [projectedOutcomes, setProjectedOutcomes] = useState([]);

  const inflationRates = {
    best: 1.8,
    base: 2.7,
    worst: 4.5,
    custom: customInflation
  };

  // Calculate future value based on inflation
  const calculateFutureValue = (presentValue, years, inflationRate) => {
    return presentValue * Math.pow(1 + inflationRate / 100, years);
  };

  // Calculate required annual return
  const calculateRequiredReturn = (presentValue, futureValue, years) => {
    return (Math.pow(futureValue / presentValue, 1 / years) - 1) * 100;
  };

  // Calculate required annual return with contributions using Newton's method
  const calculateRequiredReturnWithContributions = (initialInvestment, annualContribution, targetValue, years) => {
    if (annualContribution === 0) {
      return calculateRequiredReturn(initialInvestment, targetValue, years);
    }

    // If total contributions plus initial investment already exceed target, return 0
    const totalContributions = initialInvestment + (annualContribution * years);
    if (totalContributions >= targetValue) {
      return 0;
    }

    // Newton's method to find the required rate
    let rate = 0.1; // Initial guess of 10%
    let tolerance = 0.0001;
    let maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      const r = rate;
      
      // Calculate future value with current rate guess
      const fv = initialInvestment * Math.pow(1 + r, years) + 
                 annualContribution * ((Math.pow(1 + r, years) - 1) / r);
      
      // Calculate derivative
      const dfv = initialInvestment * years * Math.pow(1 + r, years - 1) +
                  annualContribution * (
                    (years * Math.pow(1 + r, years - 1) * r - (Math.pow(1 + r, years) - 1)) / (r * r)
                  );
      
      // Newton's method update
      const newRate = r - (fv - targetValue) / dfv;
      
      if (Math.abs(newRate - rate) < tolerance) {
        return newRate * 100;
      }
      
      rate = newRate;
    }
    
    return rate * 100;
  };

  // Calculate future value with given return rate
  const calculateFutureValueWithReturn = (initialInvestment, annualContribution, returnRate, years) => {
    const r = returnRate / 100;
    if (annualContribution === 0) {
      return initialInvestment * Math.pow(1 + r, years);
    }
    
    const futureValueInitial = initialInvestment * Math.pow(1 + r, years);
    const futureValueContributions = annualContribution * ((Math.pow(1 + r, years) - 1) / r);
    
    return futureValueInitial + futureValueContributions;
  };

  // Calculate additional contribution needed to reach target
  const calculateAdditionalContributionNeeded = (initialInvestment, currentContribution, targetValue, returnRate, years) => {
    const r = returnRate / 100;
    const futureValueInitial = initialInvestment * Math.pow(1 + r, years);
    const futureValueCurrentContrib = currentContribution * ((Math.pow(1 + r, years) - 1) / r);
    
    const gap = targetValue - futureValueInitial - futureValueCurrentContrib;
    
    if (gap <= 0) return 0;
    
    // Additional annual contribution needed
    const additionalNeeded = gap / ((Math.pow(1 + r, years) - 1) / r);
    
    return Math.max(0, additionalNeeded);
  };

  // Calculate total retirement funding needed
  const calculateTotalFunding = (inflationRate) => {
    let total = 0;
    let yearsInRetirement = endAge - retirementAge;
    
    for (let year = 0; year < yearsInRetirement; year++) {
      const futureValue = calculateFutureValue(desiredIncome, retirementAge - currentAge + year, inflationRate);
      total += futureValue;
    }
    
    return total;
  };

  // Update calculations when inputs change
  useEffect(() => {
    // Calculate future values at different ages
    const ages = [retirementAge, 60, 70, 80, endAge].filter(age => age >= retirementAge && age <= endAge);
    const values = ages.map(age => {
      const years = age - currentAge;
      return {
        age,
        years,
        best: calculateFutureValue(desiredIncome, years, inflationRates.best),
        base: calculateFutureValue(desiredIncome, years, inflationRates.base),
        worst: calculateFutureValue(desiredIncome, years, inflationRates.worst),
        custom: calculateFutureValue(desiredIncome, years, inflationRates.custom)
      };
    });
    setFutureValues(values);

    // Calculate total funding needed
    const funding = {
      best: calculateTotalFunding(inflationRates.best),
      base: calculateTotalFunding(inflationRates.base),
      worst: calculateTotalFunding(inflationRates.worst),
      custom: calculateTotalFunding(inflationRates.custom)
    };
    setTotalFunding(funding);

    // Calculate required returns for different initial investments
    const yearsToRetirement = retirementAge - currentAge;
    const requiredReturnsAmounts = [10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000];
    
    const returns = requiredReturnsAmounts.map(amount => {
      return {
        investment: amount,
        baseReturn: calculateRequiredReturn(amount, funding.base, yearsToRetirement),
        baseReturnWithContrib: calculateRequiredReturnWithContributions(amount, annualContribution, funding.base, yearsToRetirement),
        worstReturn: calculateRequiredReturn(amount, funding.worst, yearsToRetirement),
        worstReturnWithContrib: calculateRequiredReturnWithContributions(amount, annualContribution, funding.worst, yearsToRetirement),
        customReturn: calculateRequiredReturn(amount, funding.custom, yearsToRetirement),
        customReturnWithContrib: calculateRequiredReturnWithContributions(amount, annualContribution, funding.custom, yearsToRetirement)
      };
    });
    setRequiredReturns(returns);

    // Calculate projected outcomes with expected return
    // yearsToRetirement already declared above
    
    // Create investment amounts that include the user's specific amount
    let projectedOutcomesAmounts = [25000, 50000, 75000, 100000, 150000];
    
    // Ensure user's investment amount is included and sort the array
    if (initialInvestment > 0 && !projectedOutcomesAmounts.includes(initialInvestment)) {
      projectedOutcomesAmounts.push(initialInvestment);
      projectedOutcomesAmounts.sort((a, b) => a - b);
    }
    
    // Keep only 5-6 representative amounts
    if (projectedOutcomesAmounts.length > 6) {
      const step = Math.floor(projectedOutcomesAmounts.length / 5);
      const newAmounts = [];
      for (let i = 0; i < projectedOutcomesAmounts.length; i += step) {
        newAmounts.push(projectedOutcomesAmounts[i]);
      }
      // Always include the user's amount if it exists
      if (initialInvestment > 0 && !newAmounts.includes(initialInvestment)) {
        newAmounts.push(initialInvestment);
        newAmounts.sort((a, b) => a - b);
      }
      projectedOutcomesAmounts = newAmounts.slice(0, 6);
    }
    
    const outcomes = projectedOutcomesAmounts.map(amount => {
      const projectedValue = calculateFutureValueWithReturn(amount, annualContribution, expectedReturn, yearsToRetirement);
      
      return {
        investment: amount,
        projectedValue: projectedValue,
        baseCaseTarget: funding.base,
        baseCaseGap: funding.base - projectedValue,
        baseCaseMet: projectedValue >= funding.base,
        additionalForBase: calculateAdditionalContributionNeeded(amount, annualContribution, funding.base, expectedReturn, yearsToRetirement),
        worstCaseTarget: funding.worst,
        worstCaseGap: funding.worst - projectedValue,
        worstCaseMet: projectedValue >= funding.worst,
        additionalForWorst: calculateAdditionalContributionNeeded(amount, annualContribution, funding.worst, expectedReturn, yearsToRetirement),
        customTarget: funding.custom,
        customGap: funding.custom - projectedValue,
        customMet: projectedValue >= funding.custom,
        additionalForCustom: calculateAdditionalContributionNeeded(amount, annualContribution, funding.custom, expectedReturn, yearsToRetirement)
      };
    });
    setProjectedOutcomes(outcomes);

    // Calculate specific outcome for user's initial investment
    const userProjectedValue = calculateFutureValueWithReturn(initialInvestment, annualContribution, expectedReturn, yearsToRetirement);
    setUserSpecificOutcome({
      projectedValue: userProjectedValue,
      baseCaseMet: userProjectedValue >= funding.base,
      worstCaseMet: userProjectedValue >= funding.worst,
      customMet: userProjectedValue >= funding.custom,
      baseCaseGap: funding.base - userProjectedValue,
      worstCaseGap: funding.worst - userProjectedValue,
      customGap: funding.custom - userProjectedValue
    });
  }, [currentAge, retirementAge, endAge, desiredIncome, inflationRates, customInflation, annualContribution, expectedReturn, initialInvestment]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          Retirement Inflation Calculator
        </h1>
        <p className="text-gray-600">Plan for inflation's impact on your retirement purchasing power</p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Your Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Age
            </label>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="18"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retirement Age
            </label>
            <input
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={currentAge + 1}
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Life Expectancy
            </label>
            <input
              type="number"
              value={endAge}
              onChange={(e) => setEndAge(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={retirementAge + 1}
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desired Annual Income (Today's $)
            </label>
            <input
              type="number"
              value={desiredIncome}
              onChange={(e) => setDesiredIncome(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="5000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Investment Amount
            </label>
            <input
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="5000"
            />
            <p className="text-xs text-gray-500 mt-1">Lump sum available to invest now</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Contribution Until Retirement
            </label>
            <input
              type="number"
              value={annualContribution}
              onChange={(e) => setAnnualContribution(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              step="1000"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Annual savings in addition to initial investment</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inflation Scenario
            </label>
            <select
              value={inflationScenario}
              onChange={(e) => setInflationScenario(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="best">Best Case (1.8%)</option>
              <option value="base">Base Case (2.7%)</option>
              <option value="worst">Worst Case (4.5%)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {inflationScenario === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Inflation Rate (%)
              </label>
              <input
                type="number"
                value={customInflation}
                onChange={(e) => setCustomInflation(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                max="20"
                step="0.1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Projected Outcomes Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Projected Outcomes Analysis
        </h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Annual Return (%)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(parseFloat(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="50"
              step="0.5"
            />
            <span className="text-sm text-gray-600">
              (S&P 500 historical average: ~9.6%)
            </span>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            This section shows what portfolio value you'll achieve with your expected return rate, 
            and whether it meets your retirement funding goals under different inflation scenarios.
          </p>
        </div>

        {userSpecificOutcome && (
          <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Your Projected Outcome</h3>
            <p className="text-sm text-gray-700 mb-3">
              With {formatCurrency(initialInvestment)} initial investment{annualContribution > 0 && ` and ${formatCurrency(annualContribution)} annual contributions`} 
              at {formatPercent(expectedReturn)} return:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-1">
                <p className="text-xs text-gray-600">Projected Value</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(userSpecificOutcome.projectedValue)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Base Case</p>
                <p className={`text-lg font-semibold ${userSpecificOutcome.baseCaseMet ? 'text-green-600' : 'text-red-600'}`}>
                  {userSpecificOutcome.baseCaseMet ? '✓ Met' : '✗ Short'}
                </p>
                {!userSpecificOutcome.baseCaseMet && (
                  <p className="text-xs text-gray-600">{formatCurrency(Math.abs(userSpecificOutcome.baseCaseGap))}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-600">Worst Case</p>
                <p className={`text-lg font-semibold ${userSpecificOutcome.worstCaseMet ? 'text-green-600' : 'text-red-600'}`}>
                  {userSpecificOutcome.worstCaseMet ? '✓ Met' : '✗ Short'}
                </p>
                {!userSpecificOutcome.worstCaseMet && (
                  <p className="text-xs text-gray-600">{formatCurrency(Math.abs(userSpecificOutcome.worstCaseGap))}</p>
                )}
              </div>
              {inflationScenario === 'custom' && (
                <div>
                  <p className="text-xs text-gray-600">Custom</p>
                  <p className={`text-lg font-semibold ${userSpecificOutcome.customMet ? 'text-green-600' : 'text-red-600'}`}>
                    {userSpecificOutcome.customMet ? '✓ Met' : '✗ Short'}
                  </p>
                  {!userSpecificOutcome.customMet && (
                    <p className="text-xs text-gray-600">{formatCurrency(Math.abs(userSpecificOutcome.customGap))}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-gray-700">Initial Investment</th>
                <th className="px-4 py-3 text-right text-gray-700">Projected Value</th>
                <th className="px-4 py-3 text-center text-gray-700">Base Case</th>
                <th className="px-4 py-3 text-center text-gray-700">Worst Case</th>
                {inflationScenario === 'custom' && (
                  <th className="px-4 py-3 text-center text-gray-700">Custom</th>
                )}
              </tr>
            </thead>
            <tbody>
              {projectedOutcomes.length > 0 && projectedOutcomes.map((row, index) => (
                <tr key={index} className={`border-b border-gray-100 hover:bg-gray-50 ${row.investment === initialInvestment ? 'bg-blue-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">
                    {formatCurrency(row.investment)}
                    {row.investment === initialInvestment && (
                      <span className="ml-1 text-blue-600 text-xs">★</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.projectedValue)}</td>
                  
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className={`text-center font-medium ${row.baseCaseMet ? 'text-green-600' : 'text-red-600'}`}>
                        {row.baseCaseMet ? '✓ Met' : '✗ Short'}
                      </div>
                      {!row.baseCaseMet && (
                        <>
                          <div className="text-xs text-gray-600 text-center">
                            Gap: {formatCurrency(row.baseCaseGap)}
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            Need +{formatCurrency(row.additionalForBase)}/yr
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className={`text-center font-medium ${row.worstCaseMet ? 'text-green-600' : 'text-red-600'}`}>
                        {row.worstCaseMet ? '✓ Met' : '✗ Short'}
                      </div>
                      {!row.worstCaseMet && (
                        <>
                          <div className="text-xs text-gray-600 text-center">
                            Gap: {formatCurrency(row.worstCaseGap)}
                          </div>
                          <div className="text-xs text-gray-600 text-center">
                            Need +{formatCurrency(row.additionalForWorst)}/yr
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  
                  {inflationScenario === 'custom' && (
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className={`text-center font-medium ${row.customMet ? 'text-green-600' : 'text-red-600'}`}>
                          {row.customMet ? '✓ Met' : '✗ Short'}
                        </div>
                        {!row.customMet && (
                          <>
                            <div className="text-xs text-gray-600 text-center">
                              Gap: {formatCurrency(row.customGap)}
                            </div>
                            <div className="text-xs text-gray-600 text-center">
                              Need +{formatCurrency(row.additionalForCustom)}/yr
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {annualContribution > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              * Additional contributions shown are on top of your current {formatCurrency(annualContribution)} annual contribution
            </p>
          </div>
        )}
      </div>

      {/* Key Findings */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Key Findings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Income Needed at {retirementAge}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(futureValues.length > 0 ? (futureValues[0]?.[inflationScenario] || 0) : 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Income Needed at {endAge}</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(futureValues.length > 0 ? (futureValues[futureValues.length - 1]?.[inflationScenario] || 0) : 0)}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Total Retirement Funding</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalFunding[inflationScenario] || 0)}
            </p>
          </div>
        </div>
        
        {annualContribution > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Impact of Annual Contributions:</strong> Adding {formatCurrency(annualContribution)} annually for {retirementAge - currentAge} years 
              totals {formatCurrency(annualContribution * (retirementAge - currentAge))} in additional savings, 
              significantly reducing the required investment returns needed to reach your retirement goals.
            </p>
          </div>
        )}
      </div>

      {/* Future Value Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Future Income Requirements
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-gray-700">Age</th>
                <th className="px-4 py-3 text-left text-gray-700">Years from Now</th>
                <th className="px-4 py-3 text-right text-gray-700">Best Case (1.8%)</th>
                <th className="px-4 py-3 text-right text-gray-700">Base Case (2.7%)</th>
                <th className="px-4 py-3 text-right text-gray-700">Worst Case (4.5%)</th>
                {inflationScenario === 'custom' && (
                  <th className="px-4 py-3 text-right text-gray-700">Custom ({formatPercent(customInflation)})</th>
                )}
              </tr>
            </thead>
            <tbody>
              {futureValues.length > 0 && futureValues.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.age}</td>
                  <td className="px-4 py-3">{row.years}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.best)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.base)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(row.worst)}</td>
                  {inflationScenario === 'custom' && (
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(row.custom)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Required Returns Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Required Annual Returns
        </h2>
        
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p>These returns assume a single lump-sum investment{annualContribution > 0 && ` plus ${formatCurrency(annualContribution)} annual contributions`}.</p>
            <p className="mt-1">Historical S&P 500 average is ~9.6% annually. Returns above 20% are extremely difficult to achieve consistently.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-gray-700">Initial Investment</th>
                <th className="px-4 py-3 text-center text-gray-700" colSpan="2">Base Case ({formatPercent(inflationRates.base)})</th>
                <th className="px-4 py-3 text-center text-gray-700" colSpan="2">Worst Case ({formatPercent(inflationRates.worst)})</th>
                {inflationScenario === 'custom' && (
                  <th className="px-4 py-3 text-center text-gray-700" colSpan="2">Custom ({formatPercent(customInflation)})</th>
                )}
              </tr>
              <tr className="border-b border-gray-200 text-xs">
                <th className="px-4 py-2"></th>
                <th className="px-4 py-2 text-right text-gray-600">Lump Sum Only</th>
                <th className="px-4 py-2 text-right text-gray-600">With Contributions</th>
                <th className="px-4 py-2 text-right text-gray-600">Lump Sum Only</th>
                <th className="px-4 py-2 text-right text-gray-600">With Contributions</th>
                {inflationScenario === 'custom' && (
                  <>
                    <th className="px-4 py-2 text-right text-gray-600">Lump Sum Only</th>
                    <th className="px-4 py-2 text-right text-gray-600">With Contributions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {requiredReturns.length > 0 && requiredReturns.map((row, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{formatCurrency(row.investment)}</td>
                  <td className={`px-4 py-3 text-right ${row.baseReturn > 20 ? 'text-red-600 font-medium' : ''}`}>
                    {formatPercent(row.baseReturn)}
                  </td>
                  <td className={`px-4 py-3 text-right ${row.baseReturnWithContrib > 20 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}`}>
                    {formatPercent(row.baseReturnWithContrib)}
                  </td>
                  <td className={`px-4 py-3 text-right ${row.worstReturn > 25 ? 'text-red-600 font-medium' : ''}`}>
                    {formatPercent(row.worstReturn)}
                  </td>
                  <td className={`px-4 py-3 text-right ${row.worstReturnWithContrib > 25 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}`}>
                    {formatPercent(row.worstReturnWithContrib)}
                  </td>
                  {inflationScenario === 'custom' && (
                    <>
                      <td className={`px-4 py-3 text-right ${row.customReturn > 20 ? 'text-red-600 font-medium' : ''}`}>
                        {formatPercent(row.customReturn)}
                      </td>
                      <td className={`px-4 py-3 text-right ${row.customReturnWithContrib > 20 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}`}>
                        {formatPercent(row.customReturnWithContrib)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Planning Recommendations</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Use the Projected Outcomes section to test if realistic return expectations meet your goals</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Consider multiple inflation scenarios when planning - the gap between best and worst cases is substantial</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Required returns above 20% are extremely difficult to achieve consistently - consider regular contributions</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Annual contributions dramatically reduce required returns - even modest monthly savings make a big difference</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Include inflation-hedged assets like TIPS, real estate, and international diversification in your portfolio</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-1">•</span>
            <span>Maintain flexibility with potential part-time income during early retirement years</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RetirementInflationCalculator;