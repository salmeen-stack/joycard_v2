import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendInvitationEmail(opts: {
  to: string
  guestName: string
  eventTitle: string
  eventDate: string
  eventLocation: string
  cardType: string
  dressCode: string
  inviteUrl: string
}): Promise<boolean> {
  const entry = opts.cardType === 'double' ? 'Double Entry (2 persons)' : 'Single Entry (1 person)'
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0F172A;font-family:'Helvetica Neue',sans-serif;color:#F8FAFC}
.wrap{max-width:580px;margin:0 auto;padding:32px 16px}
.card{background:#1E293B;border:1px solid rgba(212,175,55,0.25);border-radius:20px;overflow:hidden}
.hdr{background:linear-gradient(135deg,#D4AF37,#E8CC6A);padding:40px 36px;text-align:center}
.hdr h1{font-size:36px;font-weight:700;color:#0F172A;letter-spacing:2px}
.hdr p{font-size:12px;color:rgba(15,23,42,0.6);letter-spacing:4px;text-transform:uppercase;margin-top:6px}
.body{padding:40px 36px}
.greet{font-size:24px;font-weight:600;color:#D4AF37;margin-bottom:20px}
.text{font-size:14px;line-height:1.8;color:rgba(248,250,252,0.7);margin-bottom:16px}
.details{background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.12);border-radius:12px;padding:24px;margin:28px 0}
.row{display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
.row:last-child{border:none}
.lbl{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#D4AF37;width:110px;flex-shrink:0}
.val{font-size:13px;color:#F8FAFC;font-weight:500}
.cta{text-align:center;margin:32px 0}
.btn{display:inline-block;background:linear-gradient(135deg,#D4AF37,#E8CC6A);color:#0F172A;text-decoration:none;padding:16px 44px;border-radius:50px;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase}
.foot{text-align:center;padding:20px 36px 32px;font-size:11px;color:rgba(248,250,252,0.25)}
</style></head>
<body><div class="wrap"><div class="card">
<div class="hdr"><h1>You're Invited</h1><p>joycard · exclusive invitation</p></div>
<div class="body">
<div class="greet">Dear ${opts.guestName},</div>
<p class="text">You are cordially invited to join us for a memorable occasion. Your presence will make this event truly special.</p>
<div class="details">
  <div class="row"><span class="lbl">Event</span><span class="val">${opts.eventTitle}</span></div>
  <div class="row"><span class="lbl">Date</span><span class="val">${opts.eventDate}</span></div>
  <div class="row"><span class="lbl">Location</span><span class="val">${opts.eventLocation}</span></div>
  <div class="row"><span class="lbl">Entry</span><span class="val">${entry}</span></div>
  <div class="row"><span class="lbl">Dress Code</span><span class="val">${opts.dressCode}</span></div>
</div>
<p class="text">Click below to view your invitation card and QR entry code.</p>
<div class="cta"><a href="${opts.inviteUrl}" class="btn">View My Invitation →</a></div>
<p class="text" style="font-size:12px;text-align:center;opacity:0.5">Present your QR code at the entrance for check-in.</p>
</div>
<div class="foot">© ${new Date().getFullYear()} joycard · Personal &amp; non-transferable</div>
</div></div></body></html>`

  try {
    await transporter.sendMail({
      from: `"joycard" <${process.env.GMAIL_USER}>`,
      to: opts.to,
      subject: `You're Invited — ${opts.eventTitle}`,
      html,
    })
    return true
  } catch (err) {
    console.error('Email error:', err)
    return false
  }
}
