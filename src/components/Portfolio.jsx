import React from "react";

export default function Portfolio({ holdings, cash, assets }) {
  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));
  const totalHoldingsValue = Object.entries(holdings).reduce((sum, [id, qty]) => {
    const price = assetMap[id]?.price || 0;
    return sum + qty * price;
  }, 0);
  const netWorth = cash + totalHoldingsValue;

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-lg font-semibold">Portfolio</h3>
      <div className="mt-2 text-sm text-neutral-300">Cash: ₹{Number(cash).toLocaleString()}</div>
      <div className="text-sm text-neutral-300">Holdings value: ₹{Number(totalHoldingsValue).toLocaleString()}</div>
      <div className="text-lg font-bold mt-2">Net Worth: ₹{Number(netWorth).toLocaleString()}</div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Positions</h4>
        <ul className="text-sm space-y-2">
          {Object.entries(holdings).length === 0 && <li className="text-neutral-400">No positions</li>}
          {Object.entries(holdings).map(([id, qty]) => (
            <li key={id} className="flex justify-between">
              <div>{id} × {qty}</div>
              <div>₹{Number((assetMap[id]?.price || 0) * qty).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
