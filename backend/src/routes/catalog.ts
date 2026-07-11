import { Router } from 'express';
import { z } from 'zod';
import { getCategorias, getProductos } from '../db/queries.js';
import { buildCatalogoPdf } from '../services/pdf.js';

export const catalogRouter = Router();

catalogRouter.get('/categorias', async (_req, res, next) => {
  try {
    const categorias = await getCategorias();
    res.json({ categorias });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/productos', async (req, res, next) => {
  try {
    const schema = z.object({
      categoriaId: z.coerce.number().optional(),
      search: z.string().trim().optional(),
    });

    const { categoriaId, search } = schema.parse(req.query);

    const productos = await getProductos({ categoriaId, search });
    res.json({ productos });
  } catch (error) {
    next(error);
  }
});

catalogRouter.get('/pdf', async (req, res, next) => {
  try {
    const schema = z.object({
      categoriaId: z.coerce.number().optional(),
      search: z.string().trim().optional(),
    });
    const { categoriaId, search } = schema.parse(req.query);
    const [categorias, productos] = await Promise.all([
      getCategorias(),
      getProductos({ categoriaId, search }),
    ]);
    const bytes = await buildCatalogoPdf(categorias, productos);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Carta_Lili_Sazon_Completa.pdf"');
    res.send(Buffer.from(bytes));
  } catch (error) {
    next(error);
  }
});
