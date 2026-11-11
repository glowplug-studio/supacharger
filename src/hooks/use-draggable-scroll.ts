'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface DraggableScrollProps {
  direction?: 'horizontal' | 'vertical';
  hideScrollbar?: boolean;
}

type DragOrigin = {
  scrollLeft: number;
  scrollTop: number;
  startX: number;
  startY: number;
};

export function useDraggableScroll({ direction = 'horizontal', hideScrollbar = true }: DraggableScrollProps = {}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef<DragOrigin | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const updateGradients = useCallback(() => {
    const element = ref.current;
    if (!element || direction !== 'horizontal') return;
    setShowLeftGradient(element.scrollLeft > 20);
    setShowRightGradient(
      element.scrollWidth > element.clientWidth && element.scrollLeft < element.scrollWidth - element.clientWidth - 20,
    );
  }, [direction]);

  const beginDrag = useCallback((pageX: number, pageY: number) => {
    const element = ref.current;
    if (!element) return;
    dragOriginRef.current = {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop,
      startX: pageX - element.offsetLeft,
      startY: pageY - element.offsetTop,
    };
    setIsDragging(true);
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => beginDrag(event.pageX, event.pageY), [beginDrag]);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (event.touches.length === 1) beginDrag(event.touches[0].pageX, event.touches[0].pageY);
    },
    [beginDrag],
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (event: MouseEvent) => {
      const origin = dragOriginRef.current;
      if (!origin) return;
      event.preventDefault();
      const walkX = (event.pageX - element.offsetLeft - origin.startX) * 1.5;
      const walkY = (event.pageY - element.offsetTop - origin.startY) * 1.5;
      if (direction === 'horizontal') element.scrollLeft = origin.scrollLeft - walkX;
      else element.scrollTop = origin.scrollTop - walkY;
      updateGradients();
    };

    const handleTouchMove = (event: TouchEvent) => {
      const origin = dragOriginRef.current;
      if (!origin || event.touches.length !== 1) return;
      event.preventDefault();
      const walkX = (event.touches[0].pageX - element.offsetLeft - origin.startX) * 1.5;
      const walkY = (event.touches[0].pageY - element.offsetTop - origin.startY) * 1.5;
      if (direction === 'horizontal') element.scrollLeft = origin.scrollLeft - walkX;
      else element.scrollTop = origin.scrollTop - walkY;
      updateGradients();
    };

    const finishDrag = () => {
      dragOriginRef.current = null;
      setIsDragging(false);
    };

    updateGradients();
    element.addEventListener('scroll', updateGradients, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', finishDrag);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', finishDrag);

    return () => {
      element.removeEventListener('scroll', updateGradients);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', finishDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', finishDrag);
    };
  }, [direction, updateGradients]);

  const scrollToStart = useCallback(() => {
    ref.current?.scrollTo({ left: 0, behavior: 'smooth' });
  }, []);

  const scrollToEnd = useCallback(() => {
    const element = ref.current;
    if (element) element.scrollTo({ left: element.scrollWidth, behavior: 'smooth' });
  }, []);

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
