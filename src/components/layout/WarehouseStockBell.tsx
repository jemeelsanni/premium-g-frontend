// Header bell: low stock, expiring soon and expired stock alerts from Inventory Management
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, AlertTriangle, Clock, PackageX } from 'lucide-react';
import { inventoryService, inventoryKeys } from '../../services/inventoryService';
import '../../pages/warehouse/inventory/inventory.css';

const SEEN_KEY = 'pg-inventory-alerts-seen';

const names = (a: string[]) =>
  a.length > 3 ? `${a.slice(0, 3).join(', ')} and ${a.length - 3} more`
    : a.length > 1 ? `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}` : a[0] || '';

export const WarehouseStockBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string>(() => {
    try { return localStorage.getItem(SEEN_KEY) || ''; } catch { return ''; }
  });

  const { data } = useQuery({
    queryKey: inventoryKeys.list,
    queryFn: () => inventoryService.getProducts(),
    staleTime: 60_000
  });

  const notes = useMemo(() => {
    const ps = data?.products ?? [];
    const low = ps.filter((p) => p.currentStock <= p.minStockLevel);
    const soon = ps.filter((p) => p.expiringBatches > 0);
    const soonCount = soon.reduce((s, p) => s + p.expiringBatches, 0);
    const exp = ps.filter((p) => p.expiredQuantity > 0);
    const expCount = exp.reduce((s, p) => s + p.expiredBatches, 0);
    const out = [];
    if (low.length) out.push({
      key: 'low', icon: <AlertTriangle />, cls: 'ivm-np-red',
      title: `Low stock: ${low.length} ${low.length === 1 ? 'product' : 'products'}`,
      desc: `${names(low.map((p) => p.name))} ${low.length === 1 ? 'is' : 'are'} at or below the min stock level.`,
      action: 'View low stock'
    });
    if (soonCount) out.push({
      key: 'expiring', icon: <Clock />, cls: 'ivm-np-yel',
      title: `Expiring soon: ${soonCount} ${soonCount === 1 ? 'batch' : 'batches'}`,
      desc: `Batches of ${names(soon.map((p) => p.name))} expire within 30 days.`,
      action: 'View expiring stock'
    });
    if (expCount) out.push({
      key: 'expired', icon: <PackageX />, cls: 'ivm-np-gray',
      title: `Expired: ${expCount} ${expCount === 1 ? 'batch' : 'batches'}`,
      desc: `Expired stock of ${names(exp.map((p) => p.name))} is no longer counted in stock.`,
      action: 'View expired stock'
    });
    return out;
  }, [data]);

  const key = notes.map((n) => n.title).join('|');
  const unseen = notes.length > 0 && key !== seen;

  const toggle = () => {
    setOpen((o) => !o);
    setSeen(key);
    try { localStorage.setItem(SEEN_KEY, key); } catch { /* storage unavailable */ }
  };

  return (
    <div className="ivm-bell-wrap">
      <button type="button" onClick={toggle} aria-haspopup="true" aria-expanded={open}
        aria-label={`Notifications${unseen ? `, ${notes.length} new` : ''}`}
        className={`ivm-bell${open ? ' ivm-bell-on' : ''}`}>
        <Bell aria-hidden="true" />
        {unseen && <span className="ivm-bell-n" aria-hidden="true">{notes.length}</span>}
      </button>
      {open && (
        <>
          <div className="ivm-np-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-label="Notifications" className="ivm-np">
            <div className="ivm-np-head">
              <span>Notifications</span>
              <span>{notes.length ? `${notes.length} ${notes.length === 1 ? 'alert' : 'alerts'}` : ''}</span>
            </div>
            {notes.map((n) => (
              <button key={n.key} type="button" className="ivm-np-item"
                onClick={() => { setOpen(false); navigate(`/warehouse/inventory?view=${n.key}`); }}>
                <span className={`ivm-np-ic ${n.cls}`} aria-hidden="true">{n.icon}</span>
                <span>
                  <span className="ivm-np-t">{n.title}</span>
                  <span className="ivm-np-d">{n.desc}</span>
                  <span className="ivm-np-a">{n.action}</span>
                </span>
              </button>
            ))}
            {!notes.length && <div className="ivm-np-none">You’re all caught up.</div>}
          </div>
        </>
      )}
    </div>
  );
};
