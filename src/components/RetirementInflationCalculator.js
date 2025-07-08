import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

const RetirementCalculator = () => {
  // State
  const [currentAge, setCurrentAge] = useState(29);
  const [retirementAge, setRetirementAge] = useState(50);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [desiredIncome, setDesiredIncome] = useState(100000);
  const [inflationScenario, setInflationScenario] = useState('moderate');
  const [customInflation, setCustomInflation] = useState(2.7);
  const [expectedReturn, setExpectedReturn] = useState(9.6);
  const [returnDuringRetirement, setReturnDuringRetirement] = useState(5.0);
  const [initialInvestment, setInitialInvestment] = useState(50000);
  const [annualContribution, setAnnualContribution] = useState(10000);
  const [taxRate, setTaxRate] = useState(22);
  const [showDetails, setShowDetails] = useState(false);
  
  const [results, setResults] = useState(null);

  // Preset values
  const inflationRates = {
    low: 1.8,
    moderate: 2.7,
    high: 4.5,
    custom: customInflation
  };

  const taxBrackets = {
    10: "10% - Low income",
    12: "12% - Lower middle",
    22: "22% - Middle income",
    24: "24% - Upper middle",
    32: "32% - High income",
    35: "35% - Very high",
    37: "37% - Highest"
  };

  // Get actual inflation rate based on scenario
  const inflationRate = inflationRates[inflationScenario];

  // Corrected calculation function
  const calculateRetirementNeeds = (currentAge, retirementAge, lifeExpectancy, desiredIncome, inflationRate, returnDuringRetirement, taxRate) => {
    // Adjust for taxes - need pre-tax income to get desired after-tax income
    const preTaxIncome = desiredIncome / (1 - taxRate / 100);
    
    const yearsToRetirement = retirementAge - currentAge;
    const incomeAtRetirement = preTaxIncome * Math.pow(1 + inflationRate / 100, yearsToRetirement);
    
    const yearsInRetirement = lifeExpectancy - retirementAge;
    const r = returnDuringRetirement / 100;
    const g = inflationRate / 100;
    
    let portfolioNeeded;
    if (Math.abs(r - g) < 0.0001) {
      portfolioNeeded = incomeAtRetirement * yearsInRetirement;
    } else {
      portfolioNeeded = incomeAtRetirement * (1 - Math.pow((1 + g) / (1 + r), yearsInRetirement)) / (r - g);
    }
    
    return { portfolioNeeded, incomeAtRetirement, preTaxIncome };
  };

  // Calculate future value with contributions
  const calculateFutureValue = (initial, annual, rate, years) => {
    const r = rate / 100;
    const futureValueInitial = initial * Math.pow(1 + r, years);
    const futureValueContributions = annual > 0 ? annual * ((Math.pow(1 + r, years) - 1) / r) : 0;
    return futureValueInitial + futureValueContributions;
  };

  // Calculate required return
  const calculateRequiredReturn = (initial, annual, target, years) => {
    if (annual === 0) {
      return (Math.pow(target / initial, 1 / years) - 1) * 100;
    }
    
    // Newton's method for rate with contributions
    let rate = 0.08;
    for (let i = 0; i < 50; i++) {
      const fv = initial * Math.pow(1 + rate, years) + annual * ((Math.pow(1 + rate, years) - 1) / rate);
      const dfv = initial * years * Math.pow(1 + rate, years - 1) +
                  annual * ((years * Math.pow(1 + rate, years - 1) * rate - (Math.pow(1 + rate, years) - 1)) / (rate * rate));
      const newRate = rate - (fv - target) / dfv;
      if (Math.abs(newRate - rate) < 0.0001) break;
      rate = newRate;
    }
    return rate * 100;
  };

  // Calculate year-by-year withdrawals
  const calculateWithdrawalSchedule = (portfolioValue, initialWithdrawal, inflationRate, returnRate, years) => {
    let balance = portfolioValue;
    let withdrawal = initialWithdrawal;
    const schedule = [];
    
    // Add initial state
    schedule.push({
      year: 0,
      withdrawal: withdrawal,
      balance: balance
    });
    
    // Track the actual withdrawal for each year
    let currentYearWithdrawal = withdrawal;
    
    // Calculate year by year, but only record every 5 years
    for (let year = 1; year <= years && balance > 0; year++) {
      // Current year's withdrawal (before applying this year's inflation)
      currentYearWithdrawal = withdrawal;
      
      // Withdraw at beginning of year
      balance -= withdrawal;
      
      if (balance <= 0) {
        schedule.push({
          year,
          withdrawal: currentYearWithdrawal,
          balance: 0,
          depleted: true
        });
        break;
      }
      
      // Portfolio grows during the year
      balance *= (1 + returnRate / 100);
      
      // Increase withdrawal for inflation for next year
      withdrawal *= (1 + inflationRate / 100);
      
      // Record every 5 years
      if (year % 5 === 0) {
        schedule.push({
          year,
          withdrawal: currentYearWithdrawal,
          balance
        });
      }
    }
    
    // If we haven't recorded the final year and portfolio isn't depleted, add it
    if (schedule[schedule.length - 1].year < years && balance > 0) {
      // Show the final year
      const finalYear = years;
      if (finalYear !== schedule[schedule.length - 1].year) {
        // Calculate remaining years
        const remainingYears = finalYear - schedule[schedule.length - 1].year;
        for (let i = 0; i < remainingYears && balance > 0; i++) {
          currentYearWithdrawal = withdrawal;
          balance -= withdrawal;
          if (balance > 0) {
            balance *= (1 + returnRate / 100);
            withdrawal *= (1 + inflationRate / 100);
          }
        }
        
        schedule.push({
          year: finalYear,
          withdrawal: currentYearWithdrawal,
          balance: Math.max(0, balance)
        });
      }
    }
    
    return schedule;
  };

  // Calculate withdrawal rate
  const calculateWithdrawalRate = (portfolioValue, firstYearWithdrawal) => {
    return (firstYearWithdrawal / portfolioValue) * 100;
  };

  // Calculate portfolio longevity
  const calculatePortfolioLongevity = (portfolioValue, initialWithdrawal, inflationRate, returnRate) => {
    let balance = portfolioValue;
    let withdrawal = initialWithdrawal;
    let years = 0;
    
    while (balance > 0 && years < 200) { // Increased limit for safety
      balance -= withdrawal;
      if (balance <= 0) break;
      balance *= (1 + returnRate / 100);
      withdrawal *= (1 + inflationRate / 100);
      years++;
    }
    
    return years;
  };

  useEffect(() => {
    const yearsToRetirement = retirementAge - currentAge;
    
    // Calculate needs for different scenarios
    const scenarios = {
      conservative: calculateRetirementNeeds(currentAge, retirementAge, lifeExpectancy, desiredIncome, 4.5, returnDuringRetirement, taxRate),
      base: calculateRetirementNeeds(currentAge, retirementAge, lifeExpectancy, desiredIncome, inflationRate, returnDuringRetirement, taxRate),
      optimistic: calculateRetirementNeeds(currentAge, retirementAge, lifeExpectancy, desiredIncome, 1.8, returnDuringRetirement, taxRate)
    };
    
    // Calculate what you'll have
    const projectedValue = calculateFutureValue(initialInvestment, annualContribution, expectedReturn, yearsToRetirement);
    
    // Calculate gaps and required returns
    const baseGap = scenarios.base.portfolioNeeded - projectedValue;
    const conservativeGap = scenarios.conservative.portfolioNeeded - projectedValue;
    
    // Additional annual savings needed
    const additionalNeeded = baseGap > 0 ? 
      calculateFutureValue(0, 1000, expectedReturn, yearsToRetirement) : 0;
    const additionalAnnual = baseGap > 0 ? (baseGap / additionalNeeded) * 1000 : 0;
    
    // Required returns for different scenarios
    const requiredReturns = {
      base: calculateRequiredReturn(initialInvestment, annualContribution, scenarios.base.portfolioNeeded, yearsToRetirement),
      conservative: calculateRequiredReturn(initialInvestment, annualContribution, scenarios.conservative.portfolioNeeded, yearsToRetirement)
    };
    
    // Calculate withdrawal schedule using projected portfolio value (what you'll actually have)
    const withdrawalSchedule = calculateWithdrawalSchedule(
      projectedValue, // Use what you'll actually have, not the minimum needed
      scenarios.base.incomeAtRetirement,
      inflationRate,
      returnDuringRetirement,
      lifeExpectancy - retirementAge
    );
    
    // Additional calculations for insights
    const withdrawalRate = calculateWithdrawalRate(projectedValue, scenarios.base.incomeAtRetirement);
    const portfolioLongevity = calculatePortfolioLongevity(
      projectedValue,
      scenarios.base.incomeAtRetirement,
      inflationRate,
      returnDuringRetirement
    );
    
    // Calculate real return
    const realReturn = ((1 + returnDuringRetirement / 100) / (1 + inflationRate / 100) - 1) * 100;
    
    // Break-even analysis
    const breakEvenReturn = inflationRate;
    
    setResults({
      scenarios,
      projectedValue,
      baseGap,
      conservativeGap,
      additionalAnnual,
      requiredReturns,
      yearsToRetirement,
      totalContributions: initialInvestment + (annualContribution * yearsToRetirement),
      withdrawalSchedule,
      afterTaxIncome: desiredIncome,
      preTaxIncome: scenarios.base.preTaxIncome,
      withdrawalRate,
      portfolioLongevity,
      realReturn,
      breakEvenReturn
    });
  }, [currentAge, retirementAge, lifeExpectancy, desiredIncome, inflationRate, initialInvestment, annualContribution, expectedReturn, returnDuringRetirement, taxRate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => `${value.toFixed(1)}%`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Calculator className="w-8 h-8 text-blue-600" />
          Retirement Calculator
        </h1>
        <p className="text-gray-600 mt-2">Make informed decisions about your retirement savings</p>
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Age</label>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retirement Age</label>
            <input
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Life Expectancy</label>
            <input
              type="number"
              value={lifeExpectancy}
              onChange={(e) => setLifeExpectancy(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">After-Tax Annual Income Needed</label>
            <input
              type="number"
              value={desiredIncome}
              onChange={(e) => setDesiredIncome(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">In today's dollars, after taxes</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Savings</label>
            <input
              type="number"
              value={initialInvestment}
              onChange={(e) => setInitialInvestment(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Contribution</label>
            <input
              type="number"
              value={annualContribution}
              onChange={(e) => setAnnualContribution(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pre-Retirement Annual Return (%)</label>
            <input
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">During Retirement Annual Return (%)</label>
            <input
              type="number"
              value={returnDuringRetirement}
              onChange={(e) => setReturnDuringRetirement(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Tax Rate in Retirement</label>
            <select
              value={taxRate}
              onChange={(e) => setTaxRate(parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(taxBrackets).map(([rate, desc]) => (
                <option key={rate} value={rate}>{desc}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inflation Assumption</label>
            <select
              value={inflationScenario}
              onChange={(e) => setInflationScenario(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low (1.8%)</option>
              <option value="moderate">Moderate (2.7%)</option>
              <option value="high">High (4.5%)</option>
              <option value="custom">Custom</option>
            </select>
            {inflationScenario === 'custom' && (
              <input
                type="number"
                value={customInflation}
                onChange={(e) => setCustomInflation(parseFloat(e.target.value) || 0)}
                className="w-full mt-2 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                step="0.1"
                placeholder="Enter custom inflation rate"
              />
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {results && (
        <>
          {/* Primary Result */}
          <div className={`rounded-lg shadow-lg p-6 ${results.baseGap <= 0 ? 'bg-green-50 border-2 border-green-500' : 'bg-amber-50 border-2 border-amber-500'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Your Retirement Outlook</h2>
              {results.baseGap <= 0 ? 
                <CheckCircle className="w-8 h-8 text-green-600" /> : 
                <AlertCircle className="w-8 h-8 text-amber-600" />
              }
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Minimum Needed</p>
                <p className="text-2xl font-bold">{formatCurrency(results.scenarios.base.portfolioNeeded)}</p>
                <p className="text-xs text-gray-500">with {formatPercent(returnDuringRetirement)} retirement returns</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">You'll Have</p>
                <p className="text-2xl font-bold">{formatCurrency(results.projectedValue)}</p>
                <p className="text-xs text-gray-500">with {formatPercent(expectedReturn)} returns</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">{results.baseGap <= 0 ? 'Surplus' : 'Shortfall'}</p>
                <p className={`text-2xl font-bold ${results.baseGap <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(results.baseGap))}
                </p>
                <p className="text-xs text-gray-500">{results.baseGap <= 0 ? 'above target' : 'below target'}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
              <Info className="w-4 h-4 text-blue-600 inline mr-1" />
              To get {formatCurrency(results.afterTaxIncome)} after taxes, you need {formatCurrency(results.preTaxIncome)} pre-tax income annually
            </div>
            
            {results.baseGap <= 0 && Math.abs(results.baseGap) > results.scenarios.base.portfolioNeeded * 0.5 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                <Info className="w-4 h-4 text-green-600 inline mr-1" />
                <span className="text-green-800">
                  Excellent! Your projected portfolio significantly exceeds the minimum needed. 
                  With {formatPercent(returnDuringRetirement)} returns, your wealth will likely grow substantially during retirement.
                </span>
              </div>
            )}
          </div>

          {/* Action Items */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Your Options
            </h2>
            
            <div className="space-y-4">
              {results.baseGap > 0 && (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-gray-900">Option 1: Increase Annual Savings</p>
                    <p className="text-lg mt-1">
                      Save an additional <span className="font-bold text-blue-600">{formatCurrency(results.additionalAnnual)}/year</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      That's {formatCurrency(results.additionalAnnual / 12)} per month extra
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="font-medium text-gray-900">Option 2: Achieve Higher Returns</p>
                    <p className="text-lg mt-1">
                      Need <span className="font-bold text-purple-600">{formatPercent(results.requiredReturns.base)}</span> annual returns
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Currently assuming {formatPercent(expectedReturn)} pre-retirement
                    </p>
                  </div>
                </>
              )}
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Sensitivity Analysis</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>• Conservative scenario (4.5% inflation): Need {formatCurrency(results.scenarios.conservative.portfolioNeeded)}</p>
                  <p>• Optimistic scenario (1.8% inflation): Need {formatCurrency(results.scenarios.optimistic.portfolioNeeded)}</p>
                  <p>• Each 1% higher return ≈ {formatCurrency((results.scenarios.base.portfolioNeeded * 0.15) / results.yearsToRetirement)} less needed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showDetails ? (
                <>Hide Details <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Show More Details <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          </div>

          {/* Detailed Analysis */}
          {showDetails && (
            <>
              {/* Withdrawal Schedule */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Retirement Portfolio Projection</h3>
                <p className="text-sm text-gray-600 mb-3">Showing 5-year intervals throughout retirement</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Year</th>
                        <th className="text-right py-2">Age</th>
                        <th className="text-right py-2">Annual Withdrawal</th>
                        <th className="text-right py-2">Portfolio Balance</th>
                        <th className="text-right py-2">% Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.withdrawalSchedule.map((item, idx) => (
                        <tr key={idx} className={`border-b ${item.depleted ? 'text-red-600' : ''}`}>
                          <td className="py-2">{item.year === 0 ? 'Start' : `Year ${item.year}`}</td>
                          <td className="text-right py-2">{retirementAge + item.year}</td>
                          <td className="text-right py-2">{formatCurrency(item.withdrawal)}</td>
                          <td className="text-right py-2">{formatCurrency(item.balance)}</td>
                          <td className="text-right py-2">
                            {item.year === 0 ? '100%' : `${((item.balance / results.projectedValue) * 100).toFixed(1)}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.withdrawalSchedule[results.withdrawalSchedule.length - 1].year < (lifeExpectancy - retirementAge) && 
                   results.withdrawalSchedule[results.withdrawalSchedule.length - 1].balance > 0 && (
                    <p className="text-xs text-gray-500 mt-2">Portfolio continues beyond shown period</p>
                  )}
                  {results.withdrawalSchedule.some(item => item.depleted) && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      ⚠ Portfolio depleted before life expectancy! Consider adjusting assumptions.
                    </p>
                  )}
                </div>
              </div>

              {/* Advanced Insights */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Advanced Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Initial Withdrawal Rate</p>
                    <p className="text-2xl font-bold text-indigo-600">{formatPercent(results.withdrawalRate)}</p>
                    <p className="text-xs text-gray-600 mt-1">Based on your actual portfolio</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Portfolio Longevity</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {results.portfolioLongevity >= 200 ? 'Indefinite' : `${results.portfolioLongevity} years`}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {results.portfolioLongevity >= 200 ? 'Portfolio sustains itself' : 'Until depletion at current assumptions'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Real Return</p>
                    <p className="text-2xl font-bold text-green-600">{formatPercent(results.realReturn)}</p>
                    <p className="text-xs text-gray-600 mt-1">Return after inflation adjustment</p>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Break-Even Return</p>
                    <p className="text-2xl font-bold text-amber-600">{formatPercent(results.breakEvenReturn)}</p>
                    <p className="text-xs text-gray-600 mt-1">Minimum to maintain purchasing power</p>
                  </div>
                </div>
              </div>

              {/* Detailed Insights */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Detailed Insights</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <div>
                      <span className="font-medium">Compounding Power:</span> Your {formatCurrency(initialInvestment)} initial investment 
                      grows by {formatPercent((results.projectedValue - results.totalContributions) / results.totalContributions * 100)} 
                      ({formatCurrency(results.projectedValue - results.totalContributions)}) through compound returns alone
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <div>
                      <span className="font-medium">Inflation Impact:</span> Your {formatCurrency(desiredIncome)} annual income 
                      requirement becomes {formatCurrency(results.scenarios.base.incomeAtRetirement)} in {results.yearsToRetirement} years,
                      a {formatPercent((results.scenarios.base.incomeAtRetirement / results.scenarios.base.preTaxIncome - 1) * 100)} increase
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <div>
                      <span className="font-medium">Time Value:</span> Each year of delay costs approximately {formatCurrency(results.scenarios.base.portfolioNeeded / results.yearsToRetirement)} 
                      in required savings at retirement
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <div>
                      <span className="font-medium">Contribution Impact:</span> Your {formatCurrency(annualContribution)} annual contributions 
                      will total {formatCurrency(annualContribution * results.yearsToRetirement)} but grow to approximately {formatCurrency(calculateFutureValue(0, annualContribution, expectedReturn, results.yearsToRetirement))}
                    </div>
                  </li>
                  {results.realReturn < 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">⚠</span>
                      <div className="text-red-700">
                        <span className="font-medium">Negative Real Return:</span> Your retirement portfolio loses purchasing power 
                        each year because returns ({formatPercent(returnDuringRetirement)}) are below inflation ({formatPercent(inflationRate)})
                      </div>
                    </li>
                  )}
                  {results.withdrawalSchedule.length > 1 && 
                   results.withdrawalSchedule[results.withdrawalSchedule.length - 1].balance > results.projectedValue && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">💰</span>
                      <div className="text-green-700">
                        <span className="font-medium">Growing Portfolio:</span> Your portfolio actually grows during retirement! 
                        Starting at {formatCurrency(results.projectedValue)} and ending at {formatCurrency(results.withdrawalSchedule[results.withdrawalSchedule.length - 1].balance)}
                      </div>
                    </li>
                  )}
                  {results.portfolioLongevity > (lifeExpectancy - retirementAge) && results.withdrawalSchedule.length > 0 && (
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <div>
                        <span className="font-medium">Estate Planning:</span> Portfolio outlasts life expectancy by {results.portfolioLongevity >= 200 ? 'indefinitely' : `${results.portfolioLongevity - (lifeExpectancy - retirementAge)} years`},
                        leaving an estimated {formatCurrency(results.withdrawalSchedule[results.withdrawalSchedule.length - 1].balance)} for heirs
                      </div>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <div>
                      <span className="font-medium">Scenario Range:</span> Portfolio needs vary by {formatCurrency(results.scenarios.conservative.portfolioNeeded - results.scenarios.optimistic.portfolioNeeded)} 
                      ({formatPercent((results.scenarios.conservative.portfolioNeeded / results.scenarios.optimistic.portfolioNeeded - 1) * 100)}) 
                      between optimistic and conservative inflation scenarios
                    </div>
                  </li>
                </ul>
              </div>

              {/* Key Assumptions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Key Assumptions & Notes</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>All values are in today's dollars for easier understanding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Tax rate of {taxRate}% applied to calculate pre-tax income needs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Assumes consistent returns (actual returns will vary)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Does not account for Social Security or other retirement income</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Consider consulting a financial advisor for personalized planning</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Key Insights */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Key Insights</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Your first-year retirement income needs to be {formatCurrency(results.scenarios.base.incomeAtRetirement)} (pre-tax) to maintain purchasing power</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Total contributions over {results.yearsToRetirement} years: {formatCurrency(results.totalContributions)} → {formatCurrency(results.projectedValue)}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Starting early is crucial: each year of delay requires ~{formatPercent((results.scenarios.base.portfolioNeeded / results.yearsToRetirement) / results.scenarios.base.portfolioNeeded * 100)} more savings</span>
              </li>
              {returnDuringRetirement < inflationRate && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">⚠</span>
                  <span className="text-amber-700">Warning: Your retirement returns ({formatPercent(returnDuringRetirement)}) are below inflation ({formatPercent(inflationRate)}). Consider a higher return target or larger portfolio.</span>
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default RetirementCalculator;
