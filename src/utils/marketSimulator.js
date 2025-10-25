// small market engine: random walk + events
export function tickPrices(assets, rngMultiplier = 1, eventImpact = {}) {
  return assets.map((a) => {
    const vol = a.vol;
    const rand = (Math.random() * 2 - 1); // -1..1
    let pct = rand * vol * rngMultiplier;

    if (eventImpact[a.id]) {
      pct += eventImpact[a.id];
    }

    const newPrice = Math.max(0.00000001, a.price * (1 + pct));
    return { ...a, price: Number(newPrice.toFixed(8)), prevPrice: a.price };
  });
}

// simple random event generator
export function generateEvent(assets) {
  const roll = Math.random();
  if (roll < 0.12) {
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const direction = Math.random() > 0.5 ? 1 : -1;
    const magnitude = (Math.random() * 0.45 + 0.05) * direction; // 5%..50%
    const description = magnitude > 0
      ? `${asset.id} surges ${Math.round(magnitude * 100)}% after major news`
      : `${asset.id} dumps ${Math.abs(Math.round(magnitude * 100))}% after FUD`;
    return {
      id: asset.id,
      impact: magnitude,
      description,
      ttl: 3 // number of ticks to apply
    };
  }
  return null;
}
