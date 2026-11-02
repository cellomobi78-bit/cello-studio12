export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    const file = formData.get('file');
    const displayName = formData.get('name') || 'Cello Audio';

    if (!file) {
      return new Response(JSON.stringify({ error: 'File tidak ditemukan' }), { status: 400 });
    }

    // Siapkan data untuk dikirim ke Roblox Open Cloud API
    const robloxForm = new FormData();
    const requestData = {
      assetType: "Audio",
      displayName: displayName,
      description: "Uploaded via Cello Studio",
      creationContext: {
        creator: { userId: env.ROBLOX_USER_ID } // ID User Roblox kamu
      }
    };
    
    robloxForm.append('request', JSON.stringify(requestData));
    robloxForm.append('fileContent', file, file.name);

    // Tembak ke API Roblox
    const response = await fetch('https://apis.roblox.com/assets/v1/assets', {
      method: 'POST',
      headers: {
        'x-api-key': env.ROBLOX_API_KEY,
      },
      body: robloxForm,
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), { status: response.status });
    }

    // Kembalikan Asset ID ke frontend
    return new Response(JSON.stringify({ success: true, assetId: result.assetId }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
