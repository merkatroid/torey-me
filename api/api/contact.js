export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({success:false});
  }
  if (!['https://torey.me', 'https://torey-me.vercel.app'].includes(req.headers.origin)) {
    return res.status(403).json({success:false});
  }
  let body;
  try { body = typeof req.body === 'string' ? (req.headers['content-type']?.includes('application/x-www-form-urlencoded') ? Object.fromEntries(new URLSearchParams(req.body)) : JSON.parse(req.body)) : req.body; }
  catch { return res.status(400).json({success:false}); }
  if (!body || typeof body !== 'object') return res.status(400).json({success:false});
  if (body.botcheck) return res.status(200).json({success:true});
  const {name, email, message} = body;
  if (typeof name !== 'string' || typeof email !== 'string' || typeof message !== 'string' ||
      !name.trim() || name.length > 120 || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || /[\r\n]/.test(email) ||
      !message.trim() || message.length > 5000) {
    return res.status(400).json({success:false});
  }
  if (!process.env.RESEND_API_KEY || !process.env.CONTACT_TO || !process.env.CONTACT_FROM) {
    return res.status(503).json({success:false});
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json'},
      body:JSON.stringify({from:process.env.CONTACT_FROM, to:[process.env.CONTACT_TO],
        reply_to:email, subject:'New message from torey.me',
        text:`Name: ${name.trim()}\nEmail: ${email}\n\n${message.trim()}`}),
      signal:AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(502).json({success:false});
    return res.status(200).json({success:true});
  } catch { return res.status(502).json({success:false}); }
}
