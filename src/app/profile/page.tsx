'use client'

import { useState } from 'react'
import ProfileModal from '@/components/ProfileModal'

export default function ProfilePage() {
  const [showModal, setShowModal] = useState(true)

  return (
    <>
      <ProfileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
