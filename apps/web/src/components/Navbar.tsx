'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSubscription } from '@/hooks/useSubscription';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

import { cn } from '@/lib/utils';

const navItems = [
  { href: '/feed', label: 'Feed' },
  { href: '/social', label: 'Social' },
  { href: '/docs', label: 'Docs' },
];

export const Navbar = () => {
  const pathname = usePathname();
  const { isPro, subscribe, loading } = useSubscription();
  const { connected } = useWallet();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-white/10',
        'bg-gradient-to-b from-black/80 via-black/60 to-transparent',
        'backdrop-blur',
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        <Link href="/" className="flex items-center gap-3 absolute left-0 top-1/2 -translate-y-1/2">
          <div className="relative h-10 w-10 z-40">
            <Image
              src="/brand/signalab-mark.png"
              alt="SignalLab logo"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <nav className="flex items-center gap-6 ml-auto">
          <ul className="hidden items-center gap-5 text-xs font-medium sm:flex">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'transition',
                    pathname === item.href ? 'text-yellow-300' : 'text-white/70 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {connected && (
                <button
                    onClick={!isPro ? () => subscribe() : undefined}
                    disabled={loading}
                    className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold transition",
                        isPro 
                            ? "bg-green-500/20 text-green-400 border border-green-500/50 cursor-default"
                            : "bg-purple-600 hover:bg-purple-500 text-white border border-purple-400 cursor-pointer"
                    )}
                >
                    {loading ? "Checking..." : isPro ? "PRO Active" : "Upgrade to PRO"}
                </button>
            )}
            
            <WalletMultiButton className="!rounded-full !h-auto !min-h-0 !bg-purple-600 hover:!bg-purple-700 !px-3.5 !py-1.5 !text-xs !font-semibold !text-white !transition shadow-lg hover:shadow-purple-500/25" />
            <Link
              href="/feed"
              className="inline-flex rounded-full bg-yellow-300 px-3.5 py-1.5 text-xs font-semibold text-black shadow-[0_14px_35px_-18px_rgba(250,204,21,0.9)] transition hover:bg-yellow-200"
            >
              Launch App
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
};
