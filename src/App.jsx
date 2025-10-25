import React, { useEffect, useState, useRef } from "react";
import { ASSETS as INIT_ASSETS } from "./data/assets";
import { tickPrices, generateEvent } from "./utils/marketSimulator";
import PriceChart from "./components/PriceChart";
import TradeControls from "./components/TradeControls";
import Portfolio from "./components/Portfolio";
import EventLog from "./components/EventLog";
import "./App.css";

const LS_CASH = "ct_cash_v1";
const LS_HOLD = "ct_holdings_v1";

function snapshotPrices(assets) {
  const base = { timestamp: Date.now() };
  assets.forEach(a => (base[a.id] = a.price));
  return base;
}

export default function App() {
  const [assets, setAssets] = useState(() => INIT_ASSETS.map(a => ({ ...a })));
  const [history, setHistory] = useState(() => [snapshotPrices(INIT_ASSETS)]);
  const [holdings, setHoldings] = useState(() => {
    const raw = localStorage.getItem(LS_HOLD);
    return raw ? JSON.parse(raw) : {};
  });
  const [cash, setCash] = useState(() => {
    const raw = localStorage.getItem(LS_CASH);
    return raw ? Number(raw) : 100000;
  });
  const [events, setEvents] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState("BTC");
  const [flashMap, setFlashMap] = useState({});

  const TICK_MS = 1500;
  const eventsRef = useRef([]);
  const eventImpactRef = useRef({});

  useEffect(() => localStorage.setItem(LS_CASH, cash), [cash]);
  useEffect(() => localStorage.setItem(LS_HOLD, JSON.stringify(holdings)), [holdings]);

  useEffect(() => {
    const interval = setInterval(() => {
      eventsRef.current = eventsRef.current
        .map(e => ({ ...e, ttl: e.ttl - 1 }))
        .filter(e => e.ttl > 0);
      setEvents([...eventsRef.current]);

      const impact = {};
      eventsRef.current.forEach(e => {
        impact[e.id] = (impact[e.id] || 0) + e.impact;
      });
      eventImpactRef.current = impact;

      setAssets(prevAssets => {
        const next = tickPrices(prevAssets, 1, impact);
        const newFlash = {};
        next.forEach(a => {
          const prev = prevAssets.find(p => p.id === a.id)?.price ?? a.price;
          if (a.price > prev) newFlash[a.id] = "up";
          else if (a.price < prev) newFlash[a.id] = "down";
        });
        setFlashMap(newFlash);
        setTimeout(() => setFlashMap({}), 380);

        setHistory(h => {
          const snap = snapshotPrices(next);
          const newHist = [...h.slice(-80), snap];
          return newHist;
        });

        return next;
      });

      const ev = generateEvent(assets);
      if (ev) {
        ev.time = Date.now();
        eventsRef.current = [...eventsRef.current, ev].slice(-20);
        setEvents([...eventsRef.current]);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [assets]);

  function handleBuy(assetId, qty) {
    if (!qty || qty <= 0) return;
    const asset = assets.find(a => a.id === assetId);
    const cost = qty * asset.price;
    if (cost > cash) return alert("Not enough cash");
    setCash(c => c - cost);
    setHoldings(h => ({ ...h, [assetId]: (h[assetId] || 0) + qty }));
  }

  function handleSell(assetId, qty) {
    if (!qty || qty <= 0) return;
    setHoldings(h => {
      const current = h[assetId] || 0;
      const sellQty = Math.min(qty, current);
      if (sellQty <= 0) {
        alert("No holdings");
        return h;
      }
      const asset = assets.find(a => a.id === assetId);
      const proceeds = sellQty * asset.price;
      setCash(c => c + proceeds);
      const next = { ...h, [assetId]: current - sellQty };
      if (next[assetId] <= 0) delete next[assetId];
      return next;
    });
  }

  const totalNet = cash + assets.reduce((s, a) => s + (holdings[a.id] || 0) * a.price, 0);
  const clearEvents = () => {
    eventsRef.current = [];
    setEvents([]);
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div>
            <h1>Crypto Tycoon Simulator</h1>
            <p className="subtext">Simulated market — practice trading, no real money</p>
          </div>
          <div className="networth">
            <div>Net Worth</div>
            <div className="value">₹ {Number(totalNet).toLocaleString()}</div>
          </div>
        </header>

        <main className="main">
          <div className="assets">
            {assets.map(a => {
              const flash = flashMap[a.id];
              const flashClass =
                flash === "up" ? "flash-up" : flash === "down" ? "flash-down" : "";
              return (
                <div key={a.id} className={`asset-card ${flashClass}`}>
                  <div className="asset-info">
                    <div>
                      <strong>
                        {a.name} ({a.id})
                      </strong>
                      <div>₹ {Number(a.price).toLocaleString()}</div>
                    </div>
                    <div className="text-right small">
                      <div>Vol {(a.vol * 100).toFixed(2)}%</div>
                      <div>Hold: {holdings[a.id] || 0}</div>
                    </div>
                  </div>
                  <div className="chart">
                    <PriceChart history={history} assetId={a.id} />
                  </div>
                  <div className="asset-footer">
                    <button onClick={() => setSelectedAssetId(a.id)}>Select</button>
                    <span>
                      {a.prevPrice
                        ? a.price > a.prevPrice
                          ? "▲ up"
                          : a.price < a.prevPrice
                          ? "▼ down"
                          : ""
                        : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <aside className="sidebar">
          <Portfolio holdings={holdings} cash={cash} assets={assets} />
          <div className="trade-section">
            <h4>Trade</h4>
            <p>Selected: <b>{selectedAssetId}</b></p>
            {assets.map(a => (
              <TradeControls
                key={a.id}
                asset={a}
                cash={cash}
                onBuy={handleBuy}
                onSell={handleSell}
              />
            ))}
          </div>

          <EventLog events={events} onClear={clearEvents} />

          <div className="quick-controls">
            <h4>Quick Controls</h4>
            <button
              onClick={() => {
                localStorage.removeItem(LS_CASH);
                localStorage.removeItem(LS_HOLD);
                setCash(100000);
                setHoldings({});
                alert("Progress reset");
              }}
            >
              Reset Progress
            </button>
            <button
              onClick={() => {
                const ev = generateEvent(assets);
                if (ev) {
                  ev.time = Date.now();
                  eventsRef.current = [...eventsRef.current, ev].slice(-20);
                  setEvents([...eventsRef.current]);
                }
              }}
            >
              Trigger Event
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
