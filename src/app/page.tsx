'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-navy-900 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal/5 blur-[100px]" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.span initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} className="font-display text-2xl text-gold font-semibold tracking-widest">joycard</motion.span>
        <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="flex gap-3">
          <Link href="/login" className="btn-ghost py-2 px-5 text-xs">Staff / Organizer</Link>
          <Link href="/admin/login" className="btn-gold py-2 px-5 text-xs">Admin</Link>
        </motion.div>
      </nav>

      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-28">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.1}}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/20 bg-gold/5 mb-8">
          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-xs tracking-widest uppercase text-gold/70">Invitation Management System</span>
        </motion.div>

        <motion.h1 initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{delay:.2}}
          className="font-display text-6xl md:text-8xl font-bold text-cream leading-none mb-6 max-w-4xl">
          Craft <span className="text-gold">Moments</span><br />Worth Remembering
        </motion.h1>

        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.35}}
          className="text-lg text-cream/50 max-w-xl mb-10 leading-relaxed">
          Complete digital invitation management — elegant card delivery, WhatsApp &amp; Email sending, and secure QR check-in.
        </motion.p>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:.5}} className="flex gap-4">
          <Link href="/login" className="btn-gold px-10 py-4">Get Started</Link>
          <Link href="/admin/login" className="btn-ghost px-10 py-4">Admin Portal</Link>
        </motion.div>
      </section>

      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon:'👑', title:'Admin', color:'gold', items:['Create & manage events','Assign organizers & staff','Full analytics','System oversight'] },
            { icon:'✉️', title:'Organizer', color:'teal', items:['Upload invitation cards','Manage guest lists','Send via WhatsApp or Email','Track delivery status'] },
            { icon:'📱', title:'Staff', color:'gold', items:['Live QR scanner','Real-time check-in stats','Duplicate scan prevention','Guest verification'] },
          ].map((c,i) => (
            <motion.div key={i} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.1}}
              className="glass-gold p-8 hover:scale-[1.02] transition-transform">
              <div className="text-3xl mb-4">{c.icon}</div>
              <h3 className={`font-display text-xl font-semibold mb-3 ${c.color==='teal'?'text-teal':'text-gold'}`}>{c.title}</h3>
              <ul className="space-y-1.5">{c.items.map((it,j)=>(
                <li key={j} className="flex items-center gap-2 text-cream/55 text-sm">
                  <span className={`w-1 h-1 rounded-full ${c.color==='teal'?'bg-teal':'bg-gold'}`} />{it}
                </li>
              ))}</ul>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-cream/20 text-xs tracking-widest">© {new Date().getFullYear()} joycard</p>
      </footer>
    </main>
  )
}
