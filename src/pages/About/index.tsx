export default function About() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>우리사이에 대하여</h1>
        <p style={{ lineHeight: 1.6 }}>
          우리사이는 함께하는 공간을 만들기 위한 프로젝트입니다. 친한 친구들과 미니게임을 즐기며 서로의 이야기를 나누고,
          특별한 벌칙으로 추억을 쌓아보세요.
        </p>
      </div>
    </div>
  );
}