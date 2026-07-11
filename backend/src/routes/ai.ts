import { Router } from 'express';
import { z } from 'zod';
import { getProductos } from '../db/queries.js';
import { chatWithAssistant } from '../services/ai.js';

export const aiRouter = Router();

aiRouter.post('/chat', async (req, res, next) => {
  try {
    const schema = z.object({
      message: z.string().trim().min(2),
    });

    const { message } = schema.parse(req.body);
    const productos = await getProductos({});
    const answer = await chatWithAssistant(message, productos);

    res.json(answer);
  } catch (error) {
    next(error);
  }
});
