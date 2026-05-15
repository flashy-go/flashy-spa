import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response(JSON.stringify({ error: 'El correo electrónico es requerido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const searchParams = new URLSearchParams({
    'filter[email][_eq]': email,
    'fields': 'id,email,registered',
    'limit': '1',
  });

  try {
    const searchRes = await fetch(`https://directus.flashygo.com/items/launch_users?${searchParams}`, {
      headers: { 'Authorization': `Bearer rNF7XpKI30C3lXzaDAEVHULZEhJcY8Ti` },
    });

    if (!searchRes.ok) {
      const errorText = await searchRes.text();
      console.error('Directus search error:', errorText);
      return new Response(JSON.stringify({ exists: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const searchData = await searchRes.json();
    const record = searchData?.data?.[0];

    return new Response(JSON.stringify({ exists: !!record, record: record || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error checking email:', err);
    return new Response(JSON.stringify({ exists: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

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

  const res = await fetch(`https://directus.flashygo.com/items/launch_users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer rNF7XpKI30C3lXzaDAEVHULZEhJcY8Ti`,
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

  const responseText = await res.text();
  console.log('Directus response:', responseText);

  // Directus puede responder con body vacío (204 No Content)
  if (!responseText || responseText.trim() === '') {
    return new Response(JSON.stringify({ message: 'Registro exitoso', id: null }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    console.error('Directus response not JSON:', responseText);
    return new Response(JSON.stringify({ error: 'Respuesta inesperada del servidor.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const recordId = data?.data?.id ?? data?.id;

  return new Response(JSON.stringify({ message: 'Registro exitoso', id: recordId }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PATCH: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body || !body.email) {
    return new Response(JSON.stringify({ error: 'Email es requerido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const directusUrl = import.meta.env.PUBLIC_DIRECTUS_URL;
  const directusToken = import.meta.env.DIRECTUS_TOKEN;

  // Directus no soporta PATCH por campo — primero buscamos el ID por email
  const searchParams = new URLSearchParams({
    'filter[email][_eq]': body.email,
    'fields': 'id',
    'limit': '1',
  });

  const searchRes = await fetch(`https://directus.flashygo.com/items/launch_users?${searchParams}`, {
    headers: { 'Authorization': `Bearer rNF7XpKI30C3lXzaDAEVHULZEhJcY8Ti` },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    console.error('Directus search error:', errorText);
    return new Response(JSON.stringify({ error: 'Error al buscar el registro.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const searchData = await searchRes.json();
  const record = searchData?.data?.[0];

  if (!record?.id) {
    return new Response(JSON.stringify({ error: 'No se encontró un registro con ese email.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ahora hacemos PATCH con el ID obtenido
  const patchRes = await fetch(`${directusUrl}/items/launch_users/${record.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${directusToken}`,
    },
    body: JSON.stringify({ registered: true }),
  });

  if (!patchRes.ok) {
    const errorText = await patchRes.text();
    console.error('Directus patch error:', errorText);
    return new Response(JSON.stringify({ error: 'Error al actualizar el registro.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'Registro actualizado', id: record.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
