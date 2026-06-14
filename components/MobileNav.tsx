'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Volleyball, FlaskConical } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/fixtures', label: 'Fixtures', Icon: Volleyball },
  { href: '/bets', label: 'Team Bets', Icon: FlaskConical },
];

export default function MobileNav(){
  const pathname=usePathname();
  if(pathname==='/login')return null;
  return(
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t" style={{background:'rgba(10,10,10,0.95)',borderColor:'rgba(255,255,255,0.08)',paddingBottom:'env(safe-area-inset-bottom)'}}>
      {ITEMS.map((item)=>{
        const active=item.href==='/'?pathname==='/':pathname.startsWith(item.href);
        const Icon = item.Icon;
        return(<Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 py-3" style={{color:active?'#E8C86A':'#9A9A9A'}}>
          <Icon size={20} strokeWidth={2} fill={active ? 'rgba(232,200,106,0.25)' : 'none'} />
          <span className="text-[10px] tracking-wider uppercase">{item.label}</span>
        </Link>);
      })}
    </nav>
  );
}
