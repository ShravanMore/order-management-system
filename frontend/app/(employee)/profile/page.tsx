"use client";

import { ProfileForm } from "@/components/profile/profile-form";
import { SalarySection } from "@/components/profile/salary-section";
import { getUser } from "@/lib/auth";

export default function EmployeeProfilePage() {
  const user = getUser();
  const isEmployee = user?.role === "employee";

  return (
    <div className="space-y-6">
      {isEmployee && <SalarySection />}
      <ProfileForm />
    </div>
  );
}
