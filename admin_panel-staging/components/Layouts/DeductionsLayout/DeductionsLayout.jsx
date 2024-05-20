import React from 'react';
import Logo from '../../shared/Logo';

const DeductionsLayout = ({ children }) => {

    return (
        <>
            <header className='flex items-center justify-start bg-primary px-20 rounded-b-md h-24 mb-5 sticky z-20'>
                <Logo />
            </header>
            <main className="px-20 py-12 overflow-y-auto scrollbar-hide">
                {children}
            </main>
        </>
    );
}

export default DeductionsLayout;
