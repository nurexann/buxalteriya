"use client";

import {
  Archive,
  BarChart3,
  Boxes,
  ClipboardList,
  Home,
  Package,
  Plus,
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

const compactNavItems = [
  navItems[0],
  navItems[1],
  { href: "/products/new", label: "Qo'shish", icon: Plus },
  navItems[4],
  navItems[2]
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  if (href === "/products" && pathname === "/products/new") {
    return false;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();
  const items = compact ? compactNavItems : navItems;

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            aria-label={item.label}
            className={`nav-link ${item.href === "/products/new" ? "primary" : ""} ${
              isActive(pathname, item.href) ? "active" : ""
            }`}
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
          <div className="topbar-actions">
            <Link className="mobile-add-button" href="/products/new" title="Tovar qo'shish">
              <Plus />
              <span>Tovar</span>
            </Link>
            <Link className="icon-button" href="/settings" title="Sozlamalar">
              <Settings />
            </Link>
          </div>
        </header>

        <main className="main-content">{children}</main>

        <nav className="bottom-nav" aria-label="Asosiy menyu">
          <NavLinks compact />
        </nav>
      </div>
    </div>
  );
}
