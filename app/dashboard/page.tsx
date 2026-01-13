"use client";

import { useSession } from "next-auth/react";
import { Users, DollarSign, Calendar, Church } from "lucide-react";

const stats = [
  { name: "Total Parishioners", value: "1,234", icon: Users, change: "+12%" },
  {
    name: "Monthly Offerings",
    value: "₦450,000",
    icon: DollarSign,
    change: "+8%",
  },
  { name: "Upcoming Appointments", value: "23", icon: Calendar, change: "" },
  { name: "Mass Intentions", value: "45", icon: Church, change: "+5%" },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session?.user?.name?.split(" ")[0] || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {session?.user?.organizationName}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-background border border-border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary">
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-foreground">
                        {stat.value}
                      </div>
                      {stat.change && (
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {stat.change}
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-background border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <DollarSign className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Record Payment</h3>
            <p className="text-sm text-muted-foreground">
              Add offering or donation
            </p>
          </button>
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <Users className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Add Parishioner</h3>
            <p className="text-sm text-muted-foreground">Register new member</p>
          </button>
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <Church className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">Book Mass Intention</h3>
            <p className="text-sm text-muted-foreground">
              Schedule mass intention
            </p>
          </button>
          <button className="p-4 border border-border rounded-md hover:bg-accent hover:border-primary transition-all text-left">
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <h3 className="font-medium">New Appointment</h3>
            <p className="text-sm text-muted-foreground">
              Schedule appointment
            </p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-background border border-border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-start space-x-3 text-sm">
            <div className="flex shrink-0">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
            </div>
            <div className="flex-1">
              <p className="text-foreground">
                Payment recorded for Sunday offering
              </p>
              <p className="text-muted-foreground text-xs mt-1">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-sm">
            <div className="flex shrink-0">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
            </div>
            <div className="flex-1">
              <p className="text-foreground">New parishioner added</p>
              <p className="text-muted-foreground text-xs mt-1">5 hours ago</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-sm">
            <div className="flex shrink-0">
              <div className="h-2 w-2 rounded-full bg-muted mt-2"></div>
            </div>
            <div className="flex-1">
              <p className="text-foreground">Mass intention booked</p>
              <p className="text-muted-foreground text-xs mt-1">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
