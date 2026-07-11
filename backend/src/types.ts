export type Categoria = {
  id_tipo_producto: number;
  nombre: string;
  descripcion: string | null;
};

export type Producto = {
  id_producto: number;
  codigo: string;
  nombre: string;
  id_tipo_producto: number;
  categoria: string;
  presentacion: string | null;
  valor: number;
  descripcion: string | null;
  imagen_url: string | null;
};

export type Cliente = {
  id_cliente: number;
  nombre: string;
  telefono: string;
  telefono_alt: string | null;
  direccion_principal: string | null;
  direccion_alterna: string | null;
  observaciones: string | null;
};

export type CartItemPayload = {
  id_producto: number;
  nombre: string;
  presentacion: string;
  valor: number;
  cantidad: number;
};

export type PrefacturaPayload = {
  cliente: {
    nombre: string;
    telefono: string;
    direccion: string;
    fechaEntrega: string;
    horaEntrega: string;
    observaciones?: string;
  };
  items: CartItemPayload[];
  impuesto: number;
};
