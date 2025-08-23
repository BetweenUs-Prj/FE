// NOTE: we avoid pulling in the FontAwesome React package here because it may
// not be installed in the consuming project.  Instead we represent rank
// changes using simple unicode arrows.  If you prefer to use icons from
// FontAwesome, install the `@fortawesome/react-fontawesome` package and
// revert this implementation accordingly.

// Simple unicode symbols used to indicate whether a player's rank has
// increased or decreased.  See also the CSS classes in index.css which
// colour the row background based on the rankChange value.  The relevant
// CSS lives in `src/styles/index.css` and is included globally via
// an import in main.tsx.
const UP_ARROW = '▲';
const DOWN_ARROW = '▼';

export interface ScoreboardItem {
  id: string;
  name: string;
  score: number;
  rankChange: number; // 1 for up, -1 for down, 0 for same
}

export default function Scoreboard({ players }: { players: ScoreboardItem[] }) {
  return (
    <ul className="scoreboard">
      {players.map((p, idx) => (
        <li
          key={p.id}
          className={`score-row ${
            p.rankChange > 0 ? 'up' : p.rankChange < 0 ? 'down' : ''
          }`}
        >
          <span>
            {idx + 1}. {p.name}
          </span>
          <span>
            {p.score}
            {p.rankChange > 0 && (
              <span style={{ marginLeft: '4px', color: '#22c55e' }}>{UP_ARROW}</span>
            )}
            {p.rankChange < 0 && (
              <span style={{ marginLeft: '4px', color: '#ef4444' }}>{DOWN_ARROW}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}