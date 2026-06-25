import React, { useEffect, useState } from 'react';

interface NumberTickerProps {
    value: number;
    duration?: number;
    delay?: number;
    decimalPlaces?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    onComplete?: () => void;
}

const NumberTicker: React.FC<NumberTickerProps> = ({
    value,
    duration = 1000,
    delay = 0,
    decimalPlaces = 2,
    prefix = '',
    suffix = '',
    className = '',
    onComplete
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let animationId: number;
        const startAnimation = () => {
            const startTime = performance.now();
            const startValue = 0; // Always start from 0 per component design

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Smooth easing function
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const currentValue = startValue + (value - startValue) * easeOutQuart;

                setDisplayValue(currentValue);

                if (progress < 1) {
                    animationId = requestAnimationFrame(animate);
                } else {
                    setDisplayValue(value); // Ensure final value is accurate
                    onComplete?.();
                }
            };
            animationId = requestAnimationFrame(animate);
        };

        const timeoutId = setTimeout(startAnimation, delay);

        return () => {
            cancelAnimationFrame(animationId);
            clearTimeout(timeoutId);
        };
    }, [value, duration, delay, onComplete]);

    const formatNumber = (num: number): string => {
        const fixedNum = num.toFixed(decimalPlaces);
        const parts = fixedNum.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    };

    return (
        <span className={`inline-block ${className}`}>
            {prefix}
            {formatNumber(displayValue)}
            {suffix}
        </span>
    );
};

export default NumberTicker;
