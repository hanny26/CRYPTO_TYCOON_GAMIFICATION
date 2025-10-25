import React, { useEffect, useState, useRef } from "react";
import { ASSETS as INIT_ASSETS } from "./data/assets";
import { tickPrices, generateEvent } from "./utils/marketSimulator";
import PriceChart from "./components/PriceChart";
import TradeControls from "./components/TradeControls";
import Portfolio from "./components/Portfolio";
import EventLog from "./components/EventLog";

const LS_CASH = "ct_cash_v1";
const LS_HOLD = "ct_holdings_v1";

function snapshotPrices(assets) {
  const base = { timestamp: Date.now() };
  assets.forEach(a => base[a.id] = a.price);
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
  const [flashMap, setFlashMap] = useState({}); // {BTC: "up" | "down" | undefined}

  const TICK_MS = 1500;
  const eventsRef = useRef([]);
  const eventImpactRef = useRef({});

  // persist cash and holdings
  useEffect(() => {
    localStorage.setItem(LS_CASH, cash);
  }, [cash]);

  useEffect(() => {
    localStorage.setItem(LS_HOLD, JSON.stringify(holdings));
  }, [holdings]);

  // main loop
  useEffect(() => {
    const interval = setInterval(() => {
      // decay TTL of events
      eventsRef.current = eventsRef.current.map(e => ({ ...e, ttl: e.ttl - 1 })).filter(e => e.ttl > 0);
      setEvents([...eventsRef.current]);

      // build impact map
      const impact = {};
      eventsRef.current.forEach(e => { impact[e.id] = (impact[e.id] || 0) + e.impact; });
      eventImpactRef.current = impact;

      // tick prices and detect up/down for flash
      setAssets(prevAssets => {
        const next = tickPrices(prevAssets, 1, impact);
        const newFlash = {};
        next.forEach(a => {
          const prev = prevAssets.find(p => p.id === a.id)?.price ?? a.price;
          if (a.price > prev) newFlash[a.id] = "up";
          else if (a.price < prev) newFlash[a.id] = "down";
        });
        setFlashMap(newFlash);

        // clear flash after short time
        setTimeout(() => setFlashMap({}), 380);

        // record history
        setHistory(h => {
          const snap = snapshotPrices(next);
          const newHist = [...h.slice(-80), snap];
          return newHist;
        });

        return next;
      });

      // maybe generate new event
      const ev = generateEvent(assets);
      if (ev) {
        ev.time = Date.now();
        eventsRef.current = [...eventsRef.current, ev].slice(-20);
        setEvents([...eventsRef.current]);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]); // using assets for event target randomness

  // Buy/sell
  function handleBuy(assetId, qty) {
    if (!qty || qty <= 0) return;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    const cost = qty * asset.price;
    if (cost > cash) {
      alert("Not enough cash");
      return;
    }
    setCash(c => Number((c - cost).toFixed(8)));
    setHoldings(h => ({ ...h, [assetId]: Number(((h[assetId] || 0) + qty).toFixed(8)) }));
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
      setCash(c => Number((c + proceeds).toFixed(8)));
      const next = { ...h, [assetId]: Number((current - sellQty).toFixed(8)) };
      if (next[assetId] <= 0) delete next[assetId];
      return next;
    });
  }

  const totalNet = cash + assets.reduce((s, a) => s + (holdings[a.id] || 0) * a.price, 0);

  const clearEvents = () => { eventsRef.current = []; setEvents([]); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 to-neutral-800 text-white p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        <header className="col-span-12 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Crypto Tycoon Simulator</h1>
            <div className="text-sm text-neutral-400">Simulated market — practice trading, no real money</div>
          </div>

          <div className="text-right">
            <div className="text-sm text-neutral-300">Net Worth</div>
            <div className="text-xl font-semibold">₹ {Number(totalNet).toLocaleString()}</div>
          </div>
        </header>

        <main className="col-span-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {assets.map(a => {
              const flash = flashMap[a.id];
              const borderClass = flash === "up" ? "ring-2 ring-green-400/40" : flash === "down" ? "ring-2 ring-red-400/30" : "";
              return (
                <div key={a.id} className={`bg-gradient-to-br from-white/3 to-white/5 p-3 rounded-lg price-flash ${borderClass}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-lg">{a.name} ({a.id})</div>
                      <div className="text-sm text-neutral-300">₹ {Number(a.price).toLocaleString()}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-xs">Vol {(a.vol * 100).toFixed(2)}%</div>
                      <div className="text-xs">Hold: {(holdings[a.id] || 0)}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <PriceChart history={history} assetId={a.id} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <button className="text-xs px-2 py-1 bg-white/6 rounded" onClick={() => setSelectedAssetId(a.id)}>
                      Select
                    </button>
                    <div className="text-xs text-neutral-400">{a.prevPrice ? (a.price > a.prevPrice ? "▲ up" : a.price < a.prevPrice ? "▼ down" : "") : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        <aside className="col-span-4 space-y-4">
          <div>
            <Portfolio holdings={holdings} cash={cash} assets={assets} />
          </div>

          <div>
            <h4 className="mb-2 font-medium">Trade</h4>
            <div className="mb-2 text-sm text-neutral-300">Selected: <span className="font-semibold">{selectedAssetId}</span></div>
            {assets.map(a => (
              <div key={a.id} className="mb-3">
                <TradeControls
                  asset={a}
                  cash={cash}
                  onBuy={(id, qty) => handleBuy(id, qty)}
                  onSell={(id, qty) => handleSell(id, qty)}
                />
              </div>
            ))}
          </div>

          <div>
            <EventLog events={events} onClear={clearEvents} />
          </div>

          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-neutral-300">Quick Controls</div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700" onClick={() => {
                // reset progress (but keep market running)
                localStorage.removeItem(LS_CASH);
                localStorage.removeItem(LS_HOLD);
                setCash(100000);
                setHoldings({});
                alert("Progress reset");
              }}>Reset Progress</button>
              <button className="py-2 px-3 rounded bg-gray-600 hover:bg-gray-700" onClick={() => {
                // quick random event to spice things
                const ev = generateEvent(assets);
                if (ev) {
                  ev.time = Date.now();
                  eventsRef.current = [...eventsRef.current, ev].slice(-20);
                  setEvents([...eventsRef.current]);
                }
              }}>Trigger Event</button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
