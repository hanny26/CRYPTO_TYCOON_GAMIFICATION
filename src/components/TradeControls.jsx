import React, { useState } from "react";

export default function TradeControls({ asset, onBuy, onSell, cash }) {
  const [qty, setQty] = useState("");

  const maxAffordable = Math.floor((cash / asset.price) * 1000000) / 1000000;

  const tryBuy = () => {
    const n = Number(qty);
    if (!n || n <= 0) return;
    onBuy(asset.id, n);
    setQty("");
  };

  const trySell = () => {
    const n = Number(qty);
    if (!n || n <= 0) return;
    onSell(asset.id, n);
    setQty("");
  };

  return (
    <div className="p-3 bg-white/5 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{asset.name} ({asset.id})</div>
          <div className="text-sm text-neutral-300">₹ {Number(asset.price).toLocaleString()}</div>
        </div>
        <div className="text-right text-sm">
          <div>Cash: ₹{Number(cash).toLocaleString()}</div>
          <div className="text-xs text-neutral-400">Max afford: {maxAffordable}</div>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 p-2 rounded bg-white/5 outline-none"
          placeholder="Qty (number)"
          value={qty}
          onChange={e => setQty(e.target.value)}
        />
        <button className="px-3 py-2 rounded bg-green-600 hover:bg-green-700" onClick={tryBuy}>Buy</button>
        <button className="px-3 py-2 rounded bg-red-600 hover:bg-red-700" onClick={trySell}>Sell</button>
      </div>
    </div>
  );
}
