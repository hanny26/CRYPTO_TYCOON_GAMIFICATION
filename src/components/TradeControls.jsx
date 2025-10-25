import React, { useState } from "react";
// import "./App.css";

export default function TradeControls({ asset, onBuy, onSell, cash }) {
  const [qty, setQty] = useState("");
  const maxAffordable = (cash / asset.price).toFixed(6);

  return (
    <div className="trade-card">
      <div className="trade-header">
        <div>
          <strong>
            {asset.name} ({asset.id})
          </strong>
          <div>₹ {Number(asset.price).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div>Cash: ₹{Number(cash).toLocaleString()}</div>
          <div className="small">Max afford: {maxAffordable}</div>
        </div>
      </div>
      <div className="trade-actions">
        <input
          type="number"
          value={qty}
          placeholder="Qty"
          onChange={e => setQty(e.target.value)}
        />
        <button className="buy" onClick={() => { onBuy(asset.id, Number(qty)); setQty(""); }}>Buy</button>
        <button className="sell" onClick={() => { onSell(asset.id, Number(qty)); setQty(""); }}>Sell</button>
      </div>
    </div>
  );
}
