"use client";

import {
  Archive,
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/products", label: "Tovarlar", icon: Package },
  { href: "/stock", label: "Ombor", icon: Boxes },
  { href: "/purchases", label: "Kirim", icon: ClipboardList },
  { href: "/sales", label: "Sotuv", icon: ShoppingCart },
  { href: "/expenses", label: "Chiqim", icon: WalletCards },
  { href: "/reports", label: "Hisobot", icon: BarChart3 },
  { href: "/trash", label: "Korzinka", icon: Archive },
  { href: "/settings", label: "Sozlama", icon: Settings }
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const items = compact ? navItems.slice(0, 5) : navItems;

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            aria-label={item.label}
            className={`nav-link ${isActive(pathname, item.href) ? "active" : ""}`}
            href={item.href}
            key={item.href}
            title={item.label}
          >
            <Icon />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/login")) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <ReceiptText size={18} />
          </span>
          <span>Shaxsiy Ombor</span>
        </Link>
        <nav className="sidebar-nav">
          <NavLinks />
        </nav>
      </aside>

      <div>
        <header className="mobile-topbar">
          <Link className="brand" href="/">
            <span className="brand-mark">
              <ReceiptText size={18} />
            </span>
            <span>Shaxsiy Ombor</span>
          </Link>
          <Link className="icon-button" href="/settings" title="Sozlamalar">
            <Settings />
          </Link>
        </header>

        <main className="main-content">{children}</main>

        <nav className="bottom-nav" aria-label="Asosiy menyu">
          <NavLinks compact />
        </nav>
      </div>
    </div>
  );
}
