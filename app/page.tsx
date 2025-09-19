import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, MapPin, BarChart3, Users, Clock, Waves, Eye, FileText, Search } from "lucide-react"
import Navbar from "@/components/Navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-3">
            <Badge variant="secondary" className="px-3 py-1 text-sm bg-success/20 text-success border-success/30">
              <Shield className="h-4 w-4 mr-2 text-success" />
              Protecting Our Oceans
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-5xl font-bold text-balance mb-3">
            Ocean Hazard
            <span className="text-primary block">Management Platform</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground text-pretty max-w-2xl mx-auto mb-5">
            Report, track, and manage ocean hazards in real-time. Keeping our marine environments safe through community
            collaboration and professional oversight.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/report">
              <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground shadow-lg">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Report a Hazard
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-primary text-primary"
              >
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 md:py-10 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-balance mb-2">Comprehensive Ocean Safety Management</h2>
            <p className="text-sm text-muted-foreground text-pretty max-w-2xl mx-auto">
              Our platform provides all the tools needed to monitor, report, and respond to ocean hazards effectively.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-border transition-shadow border-accent/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">Easy Reporting</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs bg-accent/20 text-accent">
                      <span className="text-gray-600">Citizen Reports</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Submit hazard reports with photos, GPS coordinates, and detailed descriptions. All reports start as
                  unverified and are processed by our team.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border transition-shadow border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">Real-time Dashboard</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
                      <span className="text-gray-600">Live KPIs</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Monitor total reports, verified incidents, pending verifications, and active locations with
                  interactive charts and analytics.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border transition-shadow border-success/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 rounded-lg">
                    <MapPin className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">Interactive Maps</CardTitle>
                    <Badge className="mt-1 bg-success/20 text-success border-success text-xs">
                      <span className="text-gray-600">Verified Locations</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  View hazard locations on interactive maps with verification status indicators and detailed incident
                  information.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border transition-shadow border-warning/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/20 rounded-lg">
                    <Search className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">Advanced Search</CardTitle>
                    <Badge variant="secondary" className="mt-1 text-xs bg-warning/20 text-warning">
                      <span className="text-gray-600">Smart Filters</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Search and filter hazards by location, type, date, and severity with lazy loading for optimal
                  performance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border transition-shadow border-destructive/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-destructive/20 rounded-lg">
                    <Eye className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">Admin Verification</CardTitle>
                    <Badge
                      variant="destructive"
                      className="mt-1 text-xs bg-destructive/20 text-destructive border-destructive"
                    >
                      <span className="text-gray-600">Professional Review</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Professional verification system to validate reports and manage hazard status from unverified to
                  verified to closed.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border transition-shadow border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm text-black">Community Driven</CardTitle>
                    <Badge variant="outline" className="mt-1 text-xs border-primary text-primary">
                      <span className="text-gray-600">Collaborative</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Powered by community reports and professional oversight to ensure comprehensive ocean safety
                  monitoring.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Status System */}
      <section className="py-8 md:py-10 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-balance mb-2">Three-Stage Verification System</h2>
            <p className="text-sm text-muted-foreground text-pretty max-w-2xl mx-auto">
              Every hazard report goes through our systematic verification process to ensure accuracy and appropriate
              response.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="text-center border-warning/30 bg-warning/10">
              <CardHeader className="pb-3">
                <div className="mx-auto p-3 bg-warning/20 rounded-full w-fit mb-2">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <CardTitle className="text-base text-black">Unverified</CardTitle>
                <Badge className="mx-auto bg-warning/20 text-warning border-warning text-xs">
                  <span className="text-gray-600">Default Status</span>
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  All new reports start as unverified and await professional review and validation by our team.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-success/30 bg-success/10">
              <CardHeader className="pb-3">
                <div className="mx-auto p-3 bg-success/20 rounded-full w-fit mb-2">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-base text-black">Verified</CardTitle>
                <Badge className="mx-auto bg-success/20 text-success border-success text-xs">
                  <span className="text-gray-600">Confirmed Active</span>
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Reports validated by professionals as legitimate hazards requiring attention and monitoring.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center border-muted-foreground/30 bg-muted/20">
              <CardHeader className="pb-3">
                <div className="mx-auto p-3 bg-muted/30 rounded-full w-fit mb-2">
                  <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle className="text-base text-black">Closed</CardTitle>
                <Badge className="mx-auto text-xs bg-muted/30 text-muted-foreground">
                  <span className="text-gray-600">Issue Resolved</span>
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Hazards that have been resolved, addressed, or are no longer active threats to ocean safety.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 md:py-10 px-4 bg-primary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-lg md:text-xl font-bold text-balance mb-2">Ready to Help Protect Our Oceans?</h2>
          <p className="text-sm text-muted-foreground text-pretty max-w-xl mx-auto mb-4">
            Join our community of ocean safety advocates and help us maintain safer marine environments for everyone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/report">
              <Button size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground shadow-lg">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Report Your First Hazard
              </Button>
            </Link>
            <Link href="/search">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-primary text-primary"
              >
                <Search className="h-5 w-5 mr-2 text-primary" />
                Browse Existing Reports
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-6 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">OceanGuard</span>
              <Badge variant="outline" className="ml-2 text-xs border-primary text-primary">
                Ocean Safety Platform
              </Badge>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/dashboard" className="text-muted-foreground transition-colors text-sm">
                Dashboard
              </Link>
              <Link href="/map" className="text-muted-foreground transition-colors text-sm">
                Map View
              </Link>
              <Link href="/admin" className="text-muted-foreground transition-colors text-sm">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
