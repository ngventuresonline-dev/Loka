'use client'

import PrivateInternalLayout from '@/components/PrivateInternalLayout'

export default function StatusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PrivateInternalLayout>{children}</PrivateInternalLayout>
}
