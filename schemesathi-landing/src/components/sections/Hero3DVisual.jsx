import { useEffect, useRef } from 'react';
import './Hero3DVisual.css';

/**
 * Hero3DVisual Component - Engaging 3D Moving Visual
 * 
 * Features:
 * - Floating 3D geometric shapes with smooth animations
 * - Gradient spheres with glassmorphism effect
 * - Continuous rotation and float animations
 * - Modern, eye-catching design
 * - Performance optimized with CSS transforms
 * 
 * @returns {JSX.Element} 3D animated visual
 */
export default function Hero3DVisual() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Optional: Add parallax effect on mouse move
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      
      const xPercent = (clientX / innerWidth - 0.5) * 20;
      const yPercent = (clientY / innerHeight - 0.5) * 20;
      
      const shapes = containerRef.current.querySelectorAll('.shape');
      shapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.5;
        shape.style.transform = `
          translate(${xPercent * speed}px, ${yPercent * speed}px)
          rotateX(${yPercent}deg)
          rotateY(${xPercent}deg)
        `;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="hero-3d-visual" ref={containerRef}>
      {/* Main central sphere */}
      <div className="shape sphere-main">
        <div className="sphere-inner">
          <div className="sphere-ring"></div>
          <div className="sphere-ring ring-2"></div>
        </div>
      </div>

      {/* Floating geometric shapes */}
      <div className="shape cube cube-1"></div>
      <div className="shape cube cube-2"></div>
      <div className="shape pyramid pyramid-1"></div>
      <div className="shape torus torus-1"></div>
      
      {/* Gradient orbs */}
      <div className="shape orb orb-1"></div>
      <div className="shape orb orb-2"></div>
      <div className="shape orb orb-3"></div>
      
      {/* Floating particles */}
      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      <div className="particle particle-4"></div>
      <div className="particle particle-5"></div>
      <div className="particle particle-6"></div>
      
      {/* Glow effects */}
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>
    </div>
  );
}
