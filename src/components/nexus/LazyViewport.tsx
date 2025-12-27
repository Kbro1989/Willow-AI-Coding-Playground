import React, { useEffect, useRef, useState } from 'react';
import { EyeOff } from 'lucide-react';

interface LazyViewportProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    throttleWhenIdle?: boolean;
}

/**
 * LazyViewport
 * A managed container that pauses/unmounts heavy content when off-screen.
 * Also handles idle throttling for 3D contexts.
 */
const LazyViewport: React.FC<LazyViewportProps> = ({
    children,
    fallback,
    throttleWhenIdle = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const idleTimer = useRef<number | null>(null);

    // Visibility Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            {
                root: null, // viewport
                rootMargin: '100px', // Pre-load 100px before appearing
                threshold: 0.01
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Idle Detection
    useEffect(() => {
        if (!throttleWhenIdle) return;

        const resetIdle = () => {
            if (isIdle) setIsIdle(false);
            if (idleTimer.current) window.clearTimeout(idleTimer.current);
            idleTimer.current = window.setTimeout(() => setIsIdle(true), 5000); // 5s idle
        };

        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        events.forEach(e => window.addEventListener(e, resetIdle));
        resetIdle();

        return () => {
            events.forEach(e => window.removeEventListener(e, resetIdle));
            if (idleTimer.current) window.clearTimeout(idleTimer.current);
        };
    }, [throttleWhenIdle, isIdle]);

    if (!isVisible) {
        return (
            <div ref={containerRef} className="h-full w-full flex items-center justify-center bg-black/20">
                {fallback || (
                    <div className="flex flex-col items-center opacity-50">
                        <EyeOff className="w-8 h-8 text-slate-600 mb-2" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-700">Viewport Suspended</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`h-full w-full relative transition-opacity duration-500 ${isIdle ? 'opacity-80 grayscale-[0.3]' : 'opacity-100'}`}>
            {children}
            {isIdle && (
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-[8px] font-mono text-emerald-500/50 pointer-events-none border border-emerald-500/10">
                    ECO MODE
                </div>
            )}
        </div>
    );
};

export default LazyViewport;
