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

export type CartItem = {
  id_producto: number;
  nombre: string;
  presentacion: string;
  valor: number;
  cantidad: number;
};

export type ClienteForm = {
  nombre: string;
  telefono: string;
  direccion: string;
  fechaEntrega: string;
  horaEntrega: string;
  observaciones: string;
};

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
