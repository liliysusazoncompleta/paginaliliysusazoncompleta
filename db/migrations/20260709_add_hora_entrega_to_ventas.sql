-- Migracion no destructiva para habilitar hora de entrega en pedidos web.
-- Ejecutar sobre la base existente LiliysuSazonCompleta_DB.

ALTER TABLE ventas
ADD COLUMN IF NOT EXISTS hora_entrega TIME;
