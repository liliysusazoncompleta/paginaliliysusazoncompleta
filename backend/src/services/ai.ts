import OpenAI from 'openai';
import { env } from '../config/env.js';
import type { Producto } from '../types.js';

const client = env.openAiApiKey ? new OpenAI({ apiKey: env.openAiApiKey }) : null;

export async function chatWithAssistant(input: string, products: Producto[]) {
  if (!client) {
    return {
      content:
        'Estoy en modo local sin IA externa. Te recomiendo revisar las categorias y filtrar por presupuesto en el catalogo para encontrar la mejor opcion.',
      usedFallback: true,
    };
  }

  const catalogContext = products
    .slice(0, 30)
    .map((p) => `${p.nombre} (${p.presentacion ?? 'presentacion unica'}) - $${p.valor} - ${p.categoria}`)
    .join('\n');

  const completion = await client.chat.completions.create({
    model: env.openAiModel,
    temperature: 0.6,
    messages: [
      {
        role: 'system',
        content:
          'Eres el asistente virtual de Lili y su Sazon Completa. Responde en espanol, breve, amable y orientado a conversión. Sugiere productos segun necesidad y presupuesto.',
      },
      {
        role: 'system',
        content: `Catalogo disponible:\n${catalogContext}`,
      },
      {
        role: 'user',
        content: input,
      },
    ],
  });

  return {
    content: completion.choices[0]?.message?.content ?? 'No pude generar respuesta en este momento.',
    usedFallback: false,
  };
}
