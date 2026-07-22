import { useState, useEffect, useRef } from "react";

export default function Modal({ open, onClose, children, className = "", backdropClassName = "" }) {
  const [render, setRender] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (open) {
      setRender(true);
    } else {
      setVisible(false);
      const t = setTimeout(() => setRender(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!render || !open) return;
    ref.current?.offsetHeight;
    requestAnimationFrame(() => setVisible(true));
  }, [render, open]);

  if (!render) return null;

  return (
    <div className={`fixed inset-0 z-40 grid place-items-center bg-black/40 p-4 ${backdropClassName}`}>
      <div
        ref={ref}
        className={`transition-all duration-200 ease-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
