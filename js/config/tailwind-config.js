tailwind.config = {
    theme: {
        extend: {
            fontFamily: {
                sans: ['Plus Jakarta Sans', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#f6f6f6',
                    100: '#e7e7e7',
                    500: '#525252', 
                    900: '#0a0a0a', 
                },
                accent: {
                    main: '#0a0a0a',
                    red: '#ef4444' 
                }
            },
            boxShadow: {
                'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
                'floating': '0 20px 40px -15px rgba(0,0,0,0.15)',
            }
        }
    }
}
