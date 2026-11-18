import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  path: string;
  resultKey: string;
  emptyText: string;
  renderItem: (item: Record<string, unknown>) => ReactNode;
};

export function CapabilityCard({
  title,
  description,
  path,
  resultKey,
  emptyText,
  renderItem,
}: Props) {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setItems(null);
    setError('');

    getJson<Record<string, unknown>>(path)
      .then((data) => {
        if (!active) return;
        const result = data[resultKey];
        setItems(Array.isArray(result) ? result as Record<string, unknown>[] : []);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : 'Unable to load data');
      });

    return () => { active = false; };
  }, [path, resultKey]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error && <p className="alert alert-danger" role="alert">Unable to load data: {error}</p>}
        {!error && items === null && <p role="status">Loading {title.toLowerCase()}...</p>}
        {!error && items !== null && items.length === 0 && <p>{emptyText}</p>}
        {!error && items !== null && items.length > 0 && (
          <ul className="list-group list-group-flush">
            {items.map((item, index) => (
              <li className="list-group-item" key={String(item._id ?? index)}>
                {renderItem(item)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
