export const runtime = 'edge';

import { redirect } from 'next/navigation';

// The briefing dashboard is a standalone HTML app served from /public/index.html
// Redirect root to the static file
export default function Home() {
  redirect('/index.html');
}
