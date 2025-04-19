import { RoleBasedLayout } from "@/components/app/layouts/role-based-layout"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleBasedLayout>{children}</RoleBasedLayout>
}