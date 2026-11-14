// Small building blocks for the Inventory Management screens (design's look)
import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './inventory.css';

type BtnVariant = 'blue' | 'white' | 'gray' | 'red' | 'del';

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  small?: boolean;
  loading?: boolean;
}

export const Btn: React.FC<BtnProps> = ({ variant = 'white', small, loading, disabled, className = '', children, type = 'button', ...rest }) => (
  <button
    type={type}
    className={`ivm-btn ivm-btn-${variant}${small ? ' ivm-btn-sm' : ''} ${className}`}
    disabled={disabled || loading}
    {...rest}
  >
    {loading && <span className="ivm-spin" aria-hidden="true" />}
    {children}
  </button>
);

interface ModalShellProps {
  title: string;
  width: number;
  onClose: () => void;
  alert?: boolean;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const ModalShell: React.FC<ModalShellProps> = ({ title, width, onClose, alert, children, footer }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const titleId = `ivm-m-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="ivm-overlay">
      <div className="ivm-modal" style={{ maxWidth: width }} role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={titleId}>
        <div className="ivm-m-head">
          <h2 id={titleId} className="ivm-m-title">{title}</h2>
          <button type="button" className="ivm-m-x" aria-label="Close" onClick={onClose}><X aria-hidden="true" /></button>
        </div>
        <div className="ivm-m-body">{children}</div>
        <div className="ivm-m-foot">{footer}</div>
      </div>
    </div>
  );
};

export const Pager: React.FC<{ showing: string; page: number; pages: number; label: string; onPage: (p: number) => void }> = ({ showing, page, pages, label, onPage }) => (
  <div className="ivm-pager">
    <span>{showing}</span>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>Page {page} of {pages}</span>
      <button type="button" className="ivm-pg-btn" aria-label={`Previous ${label} page`} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft aria-hidden="true" />
      </button>
      <button type="button" className="ivm-pg-btn" aria-label={`Next ${label} page`} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        <ChevronRight aria-hidden="true" />
      </button>
    </div>
  </div>
);
