import { useEffect, useMemo, useRef, useState } from "react";
import { PRODUCTS, ROASTS, naira } from "./products.js";

const CART_KEY = "mainland-roasters-cart";

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    /* storage unavailable: the cart still works for this visit */
  }
}

function RoastDots({ level }) {
  const name = ROASTS.find((r) => r.level === level).name;
  return (
    <span className="dots" role="img" aria-label={`${name} roast, ${level} of 5`}>
      {ROASTS.map((r) => (
        <span key={r.level} className={r.level <= level ? "dot on" : "dot"} />
      ))}
    </span>
  );
}

function Bag({ product }) {
  return (
    <div className="bag" style={{ "--hue": product.hue }} aria-hidden="true">
      <div className="bag-fold" />
      <div className="bag-label">
        <span className="bag-name">{product.name}</span>
        <span className="bag-meta">{product.altitude} masl</span>
        <span className="bag-weight">250 g</span>
      </div>
    </div>
  );
}

function Stepper({ qty, onChange, label }) {
  return (
    <div className="stepper" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" onClick={() => onChange(qty - 1)} aria-label={`Remove one ${label}`}>
        −
      </button>
      <span aria-live="polite">{qty}</span>
      <button type="button" onClick={() => onChange(qty + 1)} aria-label={`Add one ${label}`}>
        +
      </button>
    </div>
  );
}

function ProductCard({ product, qty, setQty }) {
  return (
    <li className="product">
      <Bag product={product} />
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="origin">{product.origin}</p>
        <p className="roast-line">
          <RoastDots level={product.roast} />
          <span>{product.process}</span>
        </p>
        <p className="notes">{product.notes.join(", ")}</p>
        <div className="buy">
          <span className="price">{naira(product.price)}</span>
          {qty > 0 ? (
            <Stepper qty={qty} onChange={setQty} label={product.name} />
          ) : (
            <button type="button" className="btn" onClick={() => setQty(1)}>
              Add to cart
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function RoastScale({ active, onPick }) {
  return (
    <div className="scale" role="group" aria-label="Filter coffees by roast">
      {ROASTS.map((r) => {
        const count = PRODUCTS.filter((p) => p.roast === r.level).length;
        return (
          <button
            key={r.level}
            type="button"
            className={`scale-step roast-${r.level}`}
            aria-pressed={active === r.level}
            onClick={() => onPick(active === r.level ? null : r.level)}
          >
            <span className="scale-name">{r.name}</span>
            <span className="scale-count">
              {count} {count === 1 ? "coffee" : "coffees"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Cart({ open, onClose, lines, total, setQty, onClear }) {
  const ref = useRef(null);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (open) setPlaced(false);
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="cart"
      aria-labelledby="cart-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="cart-inner">
        <header className="cart-head">
          <h2 id="cart-title">Your cart</h2>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>

        {lines.length === 0 ? (
          <p className="cart-empty">
            Your cart is empty. Add a bag from the shop and it will show up here.
          </p>
        ) : (
          <>
            <ul className="cart-lines">
              {lines.map(({ product, qty }) => (
                <li key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span className="cart-sub">250 g at {naira(product.price)}</span>
                  </div>
                  <Stepper qty={qty} onChange={(n) => setQty(product.id, n)} label={product.name} />
                  <span className="cart-line-total">{naira(product.price * qty)}</span>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>{naira(total)}</strong>
            </div>
            <p className="cart-note">Delivery is added at checkout. Lagos orders arrive next day.</p>
            {placed ? (
              <p className="cart-demo" role="status">
                This is a demo shop, so no order was placed and nothing was charged.
              </p>
            ) : (
              <button type="button" className="btn btn-wide" onClick={() => setPlaced(true)}>
                Check out
              </button>
            )}
            <button type="button" className="link" onClick={onClear}>
              Empty cart
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}

export default function App() {
  const [cart, setCart] = useState(loadCart);
  const [roast, setRoast] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => saveCart(cart), [cart]);

  const setQty = (id, qty) =>
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = Math.min(qty, 20);
      return next;
    });

  const lines = useMemo(
    () =>
      PRODUCTS.filter((p) => cart[p.id] > 0).map((product) => ({ product, qty: cart[product.id] })),
    [cart]
  );
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.product.price, 0);
  const shown = roast ? PRODUCTS.filter((p) => p.roast === roast) : PRODUCTS;
  const roastName = roast ? ROASTS.find((r) => r.level === roast).name : null;

  return (
    <div className="page">
      <header className="top">
        <a className="wordmark" href="#shop">
          Mainland Roasters
        </a>
        <button type="button" className="btn btn-quiet" onClick={() => setCartOpen(true)}>
          Cart ({count})
        </button>
      </header>

      <main>
        <section className="hero">
          <h1>Roasted in Yaba on Tuesday. On your doorstep by Thursday.</h1>
          <p>
            Eight coffees from Nigerian and East African farms, roasted in small batches and sold in
            250 g bags. Pick a roast on the scale to narrow the list.
          </p>
          <RoastScale active={roast} onPick={setRoast} />
        </section>

        <section id="shop" className="shop" aria-labelledby="shop-title">
          <div className="shop-head">
            <h2 id="shop-title">{roastName ? `${roastName} roasts` : "All coffees"}</h2>
            {roast && (
              <button type="button" className="link" onClick={() => setRoast(null)}>
                Show all coffees
              </button>
            )}
          </div>
          <ul className="grid">
            {shown.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                qty={cart[p.id] || 0}
                setQty={(n) => setQty(p.id, n)}
              />
            ))}
          </ul>
        </section>
      </main>

      <footer className="foot">
        <p>Mainland Roasters is a demo storefront. The coffees, prices and roastery are made up.</p>
        <p>Built with React and Vite, deployed to Huawei Cloud OBS by GitHub Actions.</p>
      </footer>

      <Cart
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={lines}
        total={total}
        setQty={setQty}
        onClear={() => setCart({})}
      />
    </div>
  );
}
