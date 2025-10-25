import React from "react";
// import "./App.css";

export default function EventLog({ events, onClear }) {
  return (
    <div className="event-log">
      <div className="log-header">
        <h4>Event Log</h4>
        <button className="clear-btn" onClick={onClear}>Clear</button>
      </div>
      <ul className="log-list">
        {events.length === 0 && <li className="muted">No events yet</li>}
        {events.slice().reverse().map((e, i) => (
          <li key={i}>
            <strong>{e.description}</strong>
            <div className="muted">{new Date(e.time).toLocaleTimeString()}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
