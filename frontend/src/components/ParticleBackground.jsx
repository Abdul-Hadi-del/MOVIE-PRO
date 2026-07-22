import { useEffect, useRef } from "react";
import { useTheme } from "../ThemeContext";

export default function ParticleBackground() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isDark = theme === "dark";
    const PARTICLE_COUNT = isDark ? 60 : 40;
    const particleColor = isDark ? "250, 204, 21" : "24, 24, 27"; // gold vs near-black

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * canvas.height;
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + 10;
        this.size = isDark ? Math.random() * 2 + 0.5 : Math.random() * 3 + 1.5;
        this.speedY = Math.random() * 0.4 + 0.1;
        this.speedX = (Math.random() - 0.5) * (isDark ? 0.3 : 0.4);
        this.opacity = isDark ? Math.random() * 0.5 + 0.1 : Math.random() * 0.25 + 0.1;
      }
      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        if (this.y < -10) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${this.opacity})`;
        ctx.fill();
      }
    }

    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}