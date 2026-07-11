import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { downloadBlob } from './utils';
import {
  descargarPrefacturaPdf,
  generarPrefactura,
  getCatalogoPdfUrl,
  getCategorias,
  getClienteByTelefono,
  getProductos,
} from './api';
import type { CartItem, Categoria, ClienteForm, Producto } from '../types';

const emptyClient: ClienteForm = {
  nombre: '',
  telefono: '',
  direccion: '',
  fechaEntrega: '',
  horaEntrega: '',
  observaciones: '',
};

type CartContextValue = {
  categorias: Categoria[];
  productos: Producto[];
  selectedCategory?: number;
  setSelectedCategory: (id?: number) => void;
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
  error: string | null;
  setError: (value: string | null) => void;

  cart: CartItem[];
  cartCount: number;
  subtotal: number;
  domicilio: number;
  total: number;
  addToCart: (producto: Producto) => void;
  increaseQty: (idProducto: number) => void;
  decreaseQty: (idProducto: number) => void;
  removeItem: (idProducto: number) => void;

  form: ClienteForm;
  setForm: React.Dispatch<React.SetStateAction<ClienteForm>>;
  autofillByPhone: (telefono: string) => Promise<void>;
  lastCliente: ClienteForm;

  sending: boolean;
  submitOrder: () => Promise<boolean>;
  downloadCatalog: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [form, setForm] = useState<ClienteForm>(emptyClient);
  const [lastCliente, setLastCliente] = useState<ClienteForm>(emptyClient);
  const [sending, setSending] = useState(false);
  const lastPhoneLookupRef = useRef('');

  function normalizePhone(value: string) {
    return value.replace(/\D/g, '');
  }

  useEffect(() => {
    void (async () => {
      try {
        const data = await getCategorias();
        setCategorias(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar categorias');
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getProductos({ categoriaId: selectedCategory, search });
        setProductos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No fue posible cargar productos');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCategory, search]);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.cantidad, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.valor * item.cantidad, 0), [cart]);
  const domicilio = subtotal > 0 ? 8000 : 0;
  const total = subtotal + domicilio;

  function addToCart(producto: Producto) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id_producto === producto.id_producto);
      if (existing) {
        return prev.map((item) =>
          item.id_producto === producto.id_producto ? { ...item, cantidad: item.cantidad + 1 } : item,
        );
      }

      return [
        ...prev,
        {
          id_producto: producto.id_producto,
          nombre: producto.nombre,
          presentacion: producto.presentacion || 'Presentacion unica',
          valor: producto.valor,
          cantidad: 1,
        },
      ];
    });
  }

  function increaseQty(idProducto: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.id_producto === idProducto ? { ...item, cantidad: item.cantidad + 1 } : item,
      ),
    );
  }

  function decreaseQty(idProducto: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id_producto === idProducto ? { ...item, cantidad: Math.max(1, item.cantidad - 1) } : item,
        )
        .filter((item) => item.cantidad > 0),
    );
  }

  function removeItem(idProducto: number) {
    setCart((prev) => prev.filter((item) => item.id_producto !== idProducto));
  }

  async function autofillByPhone(telefono: string) {
    const normalizedPhone = normalizePhone(telefono);
    if (normalizedPhone.length < 7) return;
    if (lastPhoneLookupRef.current === normalizedPhone) return;

    lastPhoneLookupRef.current = normalizedPhone;

    try {
      const cliente = await getClienteByTelefono(normalizedPhone);
      if (cliente) {
        setForm((prev) => ({
          ...prev,
          nombre: cliente.nombre || prev.nombre,
          telefono: prev.telefono,
          direccion: cliente.direccion_alterna || cliente.direccion_principal || prev.direccion,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el telefono');
    }
  }

  async function submitOrder(): Promise<boolean> {
    if (!form.nombre || !form.telefono || !form.direccion || !form.fechaEntrega || !form.horaEntrega) {
      setError('Completa los datos de entrega para generar el pedido.');
      return false;
    }
    if (cart.length === 0) {
      setError('Agrega al menos un producto al carrito.');
      return false;
    }

    setSending(true);
    setError(null);

    try {
      const prefactura = await generarPrefactura({
        cliente: form,
        items: cart,
        impuesto: domicilio,
      });

      const pdfBlob = await descargarPrefacturaPdf({
        cliente: form,
        items: cart,
        impuesto: domicilio,
      });

      setLastCliente(form);

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = prefactura.archivoNombre || `prefactura-${prefactura.referencia}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      window.open(prefactura.whatsappUrl, '_blank', 'noopener,noreferrer');
      setCart([]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible generar el pedido');
      return false;
    } finally {
      setSending(false);
    }
  }

  async function downloadCatalog() {
    try {
      // La carta descargable siempre incluye el catalogo completo (todas las
      // categorias), sin importar el filtro/busqueda activos en pantalla.
      const url = getCatalogoPdfUrl({});
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('No fue posible descargar el catalogo');
      }
      const blob = await response.blob();
      downloadBlob(blob, 'Carta_Lili_Sazon_Completa.pdf');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible descargar el catalogo');
    }
  }

  const value: CartContextValue = {
    categorias,
    productos,
    selectedCategory,
    setSelectedCategory,
    search,
    setSearch,
    loading,
    error,
    setError,
    cart,
    cartCount,
    subtotal,
    domicilio,
    total,
    addToCart,
    increaseQty,
    decreaseQty,
    removeItem,
    form,
    setForm,
    autofillByPhone,
    lastCliente,
    sending,
    submitOrder,
    downloadCatalog,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return ctx;
}
