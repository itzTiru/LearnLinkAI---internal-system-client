export default function SearchResult({ result }) {
  return (
    <div className="result-card" style={{
      border: '1px solid #ccc',
      padding: '1rem',
      marginBottom: '1rem',
      borderRadius: '8px',
      display: 'flex',
      gap: '1rem',
      alignItems: 'flex-start'
    }}>
      {result.thumbnail ? (
        <img
          src={result.thumbnail}
          alt={result.title}
          style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '4px' }}
        />
      ) : (
        <div style={{
          width: '120px',
          height: '90px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#888'
        }}>No Image</div>
      )}

      <div>
        <h3 style={{ margin: '0 0 0.5rem 0' }}>
          <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0070f3' }}>
            {result.title}
          </a>
        </h3>
        <p style={{ margin: '0 0 0.25rem 0' }}>{result.description}</p>
        <p style={{ margin: '0 0 0.25rem 0', fontSize: '12px', color: '#555' }}>
          Platform: {result.platform}
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#555' }}>
          Similarity Score: {(result.similarity_score * 100).toFixed(2)}%
        </p>
      </div>
    </div>
  );
}
