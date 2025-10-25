import React from "react";
// import "./App.css";

export default function Portfolio({ holdings, cash, assets }) {
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));
  const totalHoldingsValue = Object.entries(holdings).reduce((sum, [id, qty]) => {
    const price = assetMap[id]?.price || 0;
    return sum + qty * price;
  }, 0);
  const netWorth = cash + totalHoldingsValue;

  return (
    <div className="portfolio">
      <h3>Portfolio</h3>
      <p>Cash: ₹{Number(cash).toLocaleString()}</p>
      <p>Holdings value: ₹{Number(totalHoldingsValue).toLocaleString()}</p>
      <h4>Net Worth: ₹{Number(netWorth).toLocaleString()}</h4>
      <div className="positions">
        <h4>Positions</h4>
        {Object.entries(holdings).length === 0 ? (
          <p className="muted">No positions</p>
        ) : (
          <ul>
            {Object.entries(holdings).map(([id, qty]) => (
              <li key={id}>
                <span>
                  {id} × {qty}
                </span>
                <span>₹{Number((assetMap[id]?.price || 0) * qty).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
