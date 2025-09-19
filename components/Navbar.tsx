"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Waves, AlertTriangle, BarChart3, Search, MapPin, Shield, Home, Menu, X } from "lucide-react"

export default function Navbar() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const getNavButtons = () => {
    switch (pathname) {
      case "/report":
        return [
          { href: "/report", label: "Report Hazard", icon: AlertTriangle, active: true, color: "text-accent" },
        ]
      default:
        // For Home, Dashboard, Search, Map, and Admin pages - show all buttons
        return [
          { href: "/", label: "Home", icon: Home, active: pathname === "/", color: "text-primary" },
          {
            href: "/report",
            label: "Report Hazard",
            icon: AlertTriangle,
            active: pathname === "/report",
            color: "text-accent",
          },
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: BarChart3,
            active: pathname === "/dashboard",
            color: "text-primary",
          },
          { href: "/search", label: "Search", icon: Search, active: pathname === "/search", color: "text-warning" },
          { href: "/map", label: "Map", icon: MapPin, active: pathname === "/map", color: "text-success" },
          { href: "/admin", label: "Admin", icon: Shield, active: pathname === "/admin", color: "text-destructive" },
        ]
    }
  }

  const navButtons = getNavButtons()

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className={`mx-auto py-2 ${pathname === '/map' ? 'px-0' : 'container px-4'}`}>
        <div className={`flex items-center justify-between ${pathname === '/map' ? 'px-4' : ''}`}>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">OceanWatch</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navButtons.map((button) => (
              <Link key={button.href} href={button.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-sm transition-all duration-200 ${
                    button.active ? `${button.color} bg-current/10 shadow-sm` : `text-muted-foreground`
                  }`}
                >
                  <button.icon className={`h-4 w-4 mr-1 ${button.active ? button.color : ""}`} />
                  {button.label}
                </Button>
              </Link>
            ))}
          </div>

          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <div className="flex flex-col gap-2 pt-4">
              {navButtons.map((button) => (
                <Link key={button.href} href={button.href} onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-sm transition-all duration-200 ${
                      button.active ? `${button.color} bg-current/10 shadow-sm` : `text-muted-foreground`
                    }`}
                  >
                    <button.icon className={`h-4 w-4 mr-2 ${button.active ? button.color : ""}`} />
                    {button.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
