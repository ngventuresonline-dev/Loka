import { redirect } from 'next/navigation'

export default function NotFound() {
  // Prevent "404 Not Found" from showing to users; send them back home.
  redirect('/')
}

