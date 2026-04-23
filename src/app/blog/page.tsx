import { getBlogPostsList } from '@/lib/blog-posts'
import BlogPageClient from './BlogPageClient'

export default function BlogPage() {
  const posts = getBlogPostsList()
  return <BlogPageClient posts={posts} />
}
