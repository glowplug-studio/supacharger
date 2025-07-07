'use client';

import { useEffect,useRef, useState } from 'react';

interface DraggableScrollProps {
  direction?: 'horizontal' | 'vertical';
  hideScrollbar?: boolean;
}

export function useDraggableScroll({ direction = 'horizontal', hideScrollbar = true }: DraggableScrollProps = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!ref.current) return;

    setIsDragging(true);
    setStartX(e.pageX - ref.current.offsetLeft);
    setStartY(e.pageY - ref.current.offsetTop);
    setScrollLeft(ref.current.scrollLeft);
    setScrollTop(ref.current.scrollTop);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!ref.current || e.touches.length !== 1) return;

    setIsDragging(true);
    setStartX(e.touches[0].pageX - ref.current.offsetLeft);
    setStartY(e.touches[0].pageY - ref.current.offsetTop);
    setScrollLeft(ref.current.scrollLeft);
    setScrollTop(ref.current.scrollTop);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !ref.current) return;

    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const y = e.pageY - ref.current.offsetTop;

    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;

    if (direction === 'horizontal') {
      ref.current.scrollLeft = scrollLeft - walkX;
    } else {
      ref.current.scrollTop = scrollTop - walkY;
    }

    updateGradients();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !ref.current || e.touches.length !== 1) return;

    const x = e.touches[0].pageX - ref.current.offsetLeft;
    const y = e.touches[0].pageY - ref.current.offsetTop;

    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;

    if (direction === 'horizontal') {
      ref.current.scrollLeft = scrollLeft - walkX;
    } else {
      ref.current.scrollTop = scrollTop - walkY;
    }

    updateGradients();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateGradients = () => {
    if (!ref.current) return;

    if (direction === 'horizontal') {
      setShowLeftGradient(ref.current.scrollLeft > 20);
      setShowRightGradient(
        ref.current.scrollWidth > ref.current.clientWidth &&
          ref.current.scrollLeft < ref.current.scrollWidth - ref.current.clientWidth - 20
      );
    }
  };

  const scrollToStart = () => {
    if (!ref.current) return;
    ref.current.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const scrollToEnd = () => {
    if (!ref.current) return;
    ref.current.scrollTo({
      left: ref.current.scrollWidth,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const handleScroll = () => {
      updateGradients();
    };

    // Initial update
    updateGradients();

    // Add scroll event listener
    currentRef.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      currentRef.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, startX, startY, scrollLeft, scrollTop]);

  const containerStyles = hideScrollbar
    ? {
        scrollbarWidth: 'none' as const,
        msOverflowStyle: 'none' as const,
      }
    : {};

  return {
    ref,
    isDragging,
    showLeftGradient,
    showRightGradient,
    handleMouseDown,
    handleTouchStart,
    scrollToStart,
    scrollToEnd,
    containerStyles,
  };
}
