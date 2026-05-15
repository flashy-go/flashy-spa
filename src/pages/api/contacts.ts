import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body || !body.name || !body.phone || !body.interest) {
    return new Response(JSON.stringify({ error: 'Campos básicos incompletos (nombre, teléfono o interés).' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.interest === 'Motorizado' && !body.email) {
    return new Response(JSON.stringify({ error: 'El email es obligatorio para registrarse como motorizado.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const directusUrl = process.env.DIRECTUS_URL ?? process.env.PUBLIC_DIRECTUS_URL ?? import.meta.env.PUBLIC_DIRECTUS_URL;
  const directusToken = process.env.DIRECTUS_TOKEN ?? import.meta.env.DIRECTUS_TOKEN;

  const payload: any = {
    name: body.name,
    phone: body.phone,
    interest: body.interest,
  };

  if (body.email) payload.email = body.email;
  if (body.zone) payload.zone = body.zone;
  if (body.cupon) payload.cupon = body.cupon;

  const res = await fetch(`${directusUrl}/items/page_contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${directusToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Directus error:', errorText);
    return new Response(JSON.stringify({ error: 'Error al guardar el contacto.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Registro exitoso' }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
