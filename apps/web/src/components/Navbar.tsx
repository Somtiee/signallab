'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSubscription } from '@/hooks/useSubscription';
import { useWallet } from '@solana/wallet-adapter-react';
import { Menu, X } from 'lucide-react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', label: 'Radar' },
  { href: '/social', label: 'Signal' },
  { href: '/docs', label: 'Docs' },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { isPro, subscribe, loading } = useSubscription();
  const { connected } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-white/10',
        'bg-gradient-to-b from-black/80 via-black/60 to-transparent',
        'backdrop-blur',
      )}
    >
      <div className="mx-auto flex h-20 md:h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        {/* Logo - Bigger and standard positioning */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="relative h-16 w-16 md:h-20 md:w-20 z-40">
            <Image
              src="/brand/signalab-mark.png"
              alt="SignalLab logo"
              fill
              sizes="(max-width: 768px) 64px, 80px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 ml-auto">
          <ul className="flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'transition hover:opacity-80',
                    pathname === item.href ? 'text-yellow-300' : 'text-white/70 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 ml-4">
            {connected && (
                <button
                    onClick={!isPro ? () => subscribe() : undefined}
                    disabled={loading}
                    className={cn(
                        "rounded-full px-4 py-1.5 text-xs font-bold transition whitespace-nowrap",
                        isPro 
                            ? "bg-green-500/20 text-green-400 border border-green-500/50 cursor-default"
                            : "bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 cursor-pointer"
                    )}
                >
                    {loading ? "Checking..." : isPro ? "PRO Active" : "Upgrade to PRO"}
                </button>
            )}
            
            <div className="scale-90 origin-right">
              <WalletMultiButton className="!rounded-full !h-auto !min-h-0 !bg-purple-600 hover:!bg-purple-700 !px-4 !py-2 !text-xs !font-semibold !text-white !transition shadow-lg hover:shadow-purple-500/25" />
            </div>
            
            <Link
              href="/feed"
              className="inline-flex whitespace-nowrap rounded-full bg-yellow-300 px-4 py-2 text-xs font-semibold text-black shadow-[0_14px_35px_-18px_rgba(250,204,21,0.9)] transition hover:bg-yellow-200"
            >
              Launch App
            </Link>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-20 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
          <ul className="flex flex-col gap-4 text-base font-medium text-center">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'block py-2 transition',
                    pathname === item.href ? 'text-yellow-300' : 'text-white/70 hover:text-white',
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center gap-4 mt-4 border-t border-white/10 pt-4">
            {connected && (
                <button
                    onClick={() => {
                      if (!isPro) subscribe();
                      setIsMenuOpen(false);
                    }}
                    disabled={loading}
                    className={cn(
                        "rounded-full px-6 py-2 text-sm font-bold transition w-full max-w-xs",
                        isPro 
                            ? "bg-green-500/20 text-green-400 border border-green-500/50 cursor-default"
                            : "bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 cursor-pointer"
                    )}
                >
                    {loading ? "Checking..." : isPro ? "PRO Active" : "Upgrade to PRO"}
                </button>
            )}
            
            <div className="w-full flex justify-center">
               <WalletMultiButton className="!rounded-full !h-auto !min-h-0 !bg-purple-600 hover:!bg-purple-700 !px-6 !py-2.5 !text-sm !font-semibold !text-white !transition shadow-lg hover:shadow-purple-500/25" />
            </div>

            <Link
              href="/feed"
              className="inline-flex w-full max-w-xs justify-center rounded-full bg-yellow-300 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_14px_35px_-18px_rgba(250,204,21,0.9)] transition hover:bg-yellow-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Launch App
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
