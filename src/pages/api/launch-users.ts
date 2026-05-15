import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body || !body.email) {
    return new Response(JSON.stringify({ error: 'El correo electrónico es requerido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Basic email validation on server side
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return new Response(JSON.stringify({ error: 'Correo electrónico inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;
  const directusToken = import.meta.env.DIRECTUS_TOKEN;

  const res = await fetch(`${directusUrl}/items/launch_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${directusToken}`,
    },
    body: JSON.stringify({
      email: body.email,
      registered: false,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Directus error:', errorText);
    return new Response(JSON.stringify({ error: 'Error al registrar el correo.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const data = await res.json();

  return new Response(JSON.stringify({ message: 'Registro exitoso', id: data.data.id }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body || !body.id) {
    return new Response(JSON.stringify({ error: 'ID es requerido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;
  const directusToken = import.meta.env.DIRECTUS_TOKEN;

  const res = await fetch(`${directusUrl}/items/launch_users/${body.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${directusToken}`,
    },
    body: JSON.stringify({
      registered: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Directus error:', errorText);
    return new Response(JSON.stringify({ error: 'Error al actualizar el registro.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Registro actualizado' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
