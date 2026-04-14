import { gsap } from 'gsap';

type GsapTarget = gsap.TweenTarget;

export function fadeSlideIn(target: GsapTarget, delay = 0): gsap.core.Tween {
    return gsap.fromTo(
        target,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.2, delay, ease: 'power2.out' },
    );
}

export function staggerListIn(target: GsapTarget): gsap.core.Tween {
    return gsap.fromTo(
        target,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.15, stagger: 0.03, ease: 'power2.out' },
    );
}

export function pageTransitionIn(target: GsapTarget): gsap.core.Tween {
    return gsap.fromTo(
        target,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' },
    );
}
