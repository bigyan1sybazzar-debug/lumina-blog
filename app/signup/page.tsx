import Signup from '../../pages/Signup';
import { Suspense } from 'react';

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Signup />
        </Suspense>
    );
}
