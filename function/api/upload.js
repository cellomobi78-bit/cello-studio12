export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // 1. Ambil data dari frontend (sesuai formData di index.html)
    const formData = await request.formData();
    const file = formData.get('audio'); // Field 'audio' dari HTML baru
    const displayName = formData.get('displayName') || 'Cello Audio';

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: 'File audio tidak ditemukan dalam request.' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Cek Environment Variables di Cloudflare
    if (!env.ROBLOX_API_KEY || !env.ROBLOX_USER_ID) {
      return new Response(JSON.stringify({ success: false, error: 'Konfigurasi server belum lengkap. Pastikan ROBLOX_API_KEY dan ROBLOX_USER_ID sudah diisi di Cloudflare.' }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Siapkan data untuk Roblox Open Cloud API
    const robloxForm = new FormData();
    
    // Roblox API membutuhkan format JSON di dalam field 'request'
    const requestData = {
      assetType: "Audio",
      displayName: displayName,
      description: "Uploaded via Cello Studio",
      creationContext: {
        creator: { 
          userId: String(env.ROBLOX_USER_ID) // Pastikan string
        }
      }
    };
    
    robloxForm.append('request', JSON.stringify(requestData));
    
    // Ubah file menjadi Blob/File agar bisa dibaca Roblox API
    robloxForm.append('fileContent', file, file.name);

    // 4. Kirim ke API Roblox
    const robloxResponse = await fetch('https://apis.roblox.com/assets/v1/assets', {
      method: 'POST',
      headers: {
        'x-api-key': env.ROBLOX_API_KEY,
      },
      body: robloxForm,
    });

    const result = await robloxResponse.json();

    // 5. Jika Roblox menolak (Error 400, 401, 403, dll)
    if (!robloxResponse.ok) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: result.message || result.error || 'Ditolak oleh API Roblox',
        detail: result
      }), { 
        status: robloxResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Jika berhasil, kirim Asset ID kembali ke frontend
    return new Response(JSON.stringify({ 
      success: true, 
      assetId: result.assetId,
      operationId: result.operationId // Biasanya Roblox mengembalikan operationId dulu
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    // 7. Tangkap error server (misal koneksi putus)
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
