import { Router } from 'express';
import { z } from 'zod';
import { getClienteByTelefono } from '../db/queries.js';

export const clientesRouter = Router();

clientesRouter.get('/by-telefono/:telefono', async (req, res, next) => {
  try {
    const schema = z.object({
      telefono: z.string().trim().min(7).max(30),
    });

    const { telefono } = schema.parse(req.params);
    const cliente = await getClienteByTelefono(telefono);

    res.json({ cliente });
  } catch (error) {
    next(error);
  }
});
