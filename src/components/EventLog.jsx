import React from "react";

export default function EventLog({ events, onClear }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 h-44 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">Event Log</h4>
        <button className="text-xs text-neutral-400 hover:text-white" onClick={onClear}>Clear</button>
      </div>
      <ul className="text-sm text-neutral-300 overflow-y-auto space-y-2">
        {events.length === 0 && <li className="text-neutral-500">No events yet</li>}
        {events.slice().reverse().map((e, i) => (
          <li key={i} className="text-xs">
            <div className="font-semibold">{e.description}</div>
            <div className="text-neutral-400">{new Date(e.time).toLocaleTimeString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
