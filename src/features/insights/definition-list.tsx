/** Terms and their meanings, for the panel behind a "?". */
export function DefinitionList({ items }: { items: Record<string, string> }) {
  return (
    <dl className="flex flex-col gap-1">
      {Object.entries(items).map(([term, meaning]) => (
        <div key={term}>
          <dt className="inline font-semibold capitalize">{term}</dt>{' '}
          <dd className="inline">— {meaning}</dd>
        </div>
      ))}
    </dl>
  )
}
