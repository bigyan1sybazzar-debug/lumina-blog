import { redirect } from 'next/navigation';

// Redirect old /tools/live-score to the new /live-football page
export default function LiveScoreRedirect() {
    redirect('/live-football');
}
