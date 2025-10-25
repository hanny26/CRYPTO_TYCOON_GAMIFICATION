import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function PriceChart({ history, assetId }) {
  const data = history.map(h => ({ time: new Date(h.timestamp).toLocaleTimeString(), price: h[assetId] }));
  return (
    <div className="w-full h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto','auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="price" dot={false} stroke="#60a5fa" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
