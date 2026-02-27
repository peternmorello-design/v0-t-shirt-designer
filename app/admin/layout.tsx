import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - T-Shirt Designer',
  description: 'Manage templates and settings for the T-shirt designer',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
