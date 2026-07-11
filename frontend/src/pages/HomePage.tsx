import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Flame, Heart, Zap } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { getProductos } from '../lib/api';
import { useCart } from '../lib/CartContext';
import type { Producto } from '../types';

export function HomePage() {
  const { addToCart } = useCart();
  const [favoritos, setFavoritos] = useState<Producto[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getProductos({});
        setFavoritos(data.slice(0, 3));
      } catch {
        setFavoritos([]);
      }
    })();
  }, []);

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="pill-tag">
            <Flame size={14} /> Sabor 100% Criollo y Artesanal
          </span>
          <h1>
            El verdadero sabor
            <br />
            de <span>la abuela Lili</span>
          </h1>
          <p>
            Llevamos el calor del hogar a tu mesa. Descubre nuestras deliciosas preparaciones caseras,
            sazones listas y postres tradicionales elaborados con ingredientes de primera y la receta
            secreta de generaciones.
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="hero-primary">Ver Catalogo Completo →</Link>
            <Link to="/contacto" className="hero-secondary">Contactanos Ahora</Link>
          </div>
        </div>

        <div className="hero-media">
          <span className="hero-media-badge">
            <span className="dot" /> Servido caliente hoy!
          </span>
          <img
            src="https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1000&q=65"
            alt="Plato casero tradicional"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <section className="story-section">
        <span className="section-eyebrow">Nuestra Historia de Familia</span>
        <p className="story-text">
          "Lili y su Sazon Completa" nacio en la cocina de nuestra abuela Lili, donde el aroma de las
          hierbas frescas y el sancocho hirviendo en la olla de barro reunia a toda la familia cada
          domingo. Cansada de las sazones artificiales del mercado, Lili perfecciono su propia formula
          100% natural. Hoy compartimos ese secreto de generaciones contigo para que cada plato que
          cocines en casa sepa a amor de familia.
        </p>

        <div className="story-features">
          <article className="story-feature">
            <span className="story-icon">
              <Award size={20} />
            </span>
            <h4>Calidad Artesanal</h4>
            <p>Preparado a mano en pequenos lotes frescos.</p>
          </article>
          <article className="story-feature">
            <span className="story-icon">
              <Heart size={20} />
            </span>
            <h4>Ingredientes Reales</h4>
            <p>Sin aditivos, colorantes ni conservantes artificiales.</p>
          </article>
          <article className="story-feature">
            <span className="story-icon">
              <Zap size={20} />
            </span>
            <h4>Facil de Usar</h4>
            <p>Ahorra tiempo y dale el toque perfecto a tu comida.</p>
          </article>
        </div>
      </section>

      <section className="favorites-section">
        <div className="favorites-header">
          <div>
            <h2>Los Favoritos de la Casa</h2>
            <p>Los platos y sazones mas pedidos por nuestros clientes consentidos.</p>
          </div>
          <Link to="/catalogo" className="link-arrow">Ver todo el catalogo →</Link>
        </div>

        <div className="products-grid featured-grid">
          {favoritos.map((producto) => (
            <ProductCard key={producto.id_producto} producto={producto} onAdd={addToCart} />
          ))}
        </div>
      </section>
    </>
  );
}
