import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Flame, Heart, Zap } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { getProductos } from '../lib/api';
import { useCart } from '../lib/CartContext';
import liliBienvenidaImg from '../image/liliBienvenida.png';
import type { Producto } from '../types';

export function HomePage() {
  const { addToCart } = useCart();
  const [favoritos, setFavoritos] = useState<Producto[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const productNames = ['TERINA DE POLLO', 'SANDUCHE EN PAN DANES', 'PAPA RELLENA MED', 'SALSA MIEL MOSTAZA'];
        const allResults = await Promise.all(
          productNames.map(name => getProductos({ search: name }))
        );
        const favorites = allResults.flat().filter((p, i, arr) => arr.findIndex(t => t.id_producto === p.id_producto) === i);
        setFavoritos(favorites);
      } catch {
        setFavoritos([]);
      }
    })();
  }, []);

  return (
    <>
     <span className="pill-tag">
            <Flame size={14} /> Sabor 100% Original
          </span>

      <section className="hero-section">
        <span className="section-eyebrow">🍽️ Bienvenidos a Lili y Su Sazón Completa</span>
        <p className="story-text">
          En <strong>Lili y Su Sazón Completa</strong> creemos que cada comida es una oportunidad para reunir a las personas, crear recuerdos y compartir momentos inolvidables.
        </p>
        <div className="hero-copy">
        <p className="story-text">
          Somos una <strong>empresa familiar colombiana</strong>, nacida en la ciudad de <strong>Medellín</strong>, con más de <strong>10 años de experiencia</strong> llevando a hogares, empresas y eventos el auténtico sabor de la cocina casera, preparada con amor y dedicación.
        </p>
        <p className="story-text">
          Cada plato que elaboramos refleja nuestra pasión por la buena cocina. Seleccionamos cuidadosamente ingredientes frescos y de excelente calidad para ofrecer alimentos deliciosos, saludables y con ese sabor tradicional que solo una receta hecha en casa puede brindar.
        </p>
        <h3 style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>¿Qué nos hace diferentes?</h3>
        <div className="story-features">
          <article className="story-feature">
            <span className="story-icon">
              <Heart size={20} />
            </span>
            <h4>Sabor Casero Auténtico</h4>
            <p>Que conquista desde el primer bocado.</p>
          </article>
          <article className="story-feature">
            <span className="story-icon">
              <Award size={20} />
            </span>
            <h4>Ingredientes de Primera</h4>
            <p>Frescos y seleccionados cuidadosamente.</p>
          </article>
          <article className="story-feature">
            <span className="story-icon">
              <Zap size={20} />
            </span>
            <h4>Atención Personalizada</h4>
            <p>Porque cada cliente hace parte de nuestra familia.</p>
          </article>
        </div>

        <p className="story-text" style={{ marginTop: '2rem' }}>
          Nuestros clientes nos eligen y recomiendan porque encuentran en nosotros mucho más que un servicio de alimentación: encuentran <strong>compromiso, puntualidad, confianza</strong> y una experiencia gastronómica que hace sentir el calor del hogar en cada plato.
        </p>
        <p className="story-text">
          <strong>Nuestra misión</strong> es hacer que cada comida sea una experiencia especial, ofreciendo productos preparados con amor, higiene, calidad y el auténtico sabor de la cocina colombiana.
        </p>
        <p className="story-text" style={{ marginTop: '2rem', fontStyle: 'italic', textAlign: 'center', color: '#2d5f3f' }}>
          💚 <strong>Déjanos poner el sabor en tu mesa mientras tú disfrutas de los momentos que realmente importan.</strong>
        </p>
        <p className="story-text" style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold' }}>
          ¡Será un placer cocinar para ti y tu familia!
        </p>
        </div>

        <div className="hero-media">
          <span className="hero-media-badge">
            <span className="dot" /> Servido caliente hoy!
          </span>
          <img
            src={liliBienvenidaImg}
            alt="Lili Bienvenida"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <section className="story-section">
        {/* <div className="hero-copy"> */}
          <h2>
            Más que comida,
            <br />
            una <span className="story-text" style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold' }}>experiencia inolvidable </span>completa con lili y su sazòn con amor
          </h2>
          <p>
            Llevamos el calor del hogar a tu mesa. Descubre nuestras deliciosas preparaciones caseras, sazones listas y postres tradicionales elaborados con ingredientes de primera.
          </p>
          <div className="hero-actions">
            <Link to="/catalogo" className="hero-primary">Ver Catalogo Completo →</Link>
            <Link to="/contacto" className="hero-secondary">Contactanos Ahora</Link>
          </div>
        {/* </div> */}

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
