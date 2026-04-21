import { useState } from 'react'
import PageRplacement from './Pagereplacementsimulator'
import mithileshPhoto from './assets/mithilesh.svg'
import mirtulaPhoto from './assets/mirtula.svg'
import mithunPhoto from './assets/mithun.svg'
import './App.css'

function App() {
  const [page, setPage] = useState('home')

  const team = [
    {
      name: 'Mithilesh B R',
      photo: mithileshPhoto,
    },
    {
      name: 'Mirtula',
      photo: mirtulaPhoto,
    },
    {
      name: 'Mithun Chakravarthy',
      photo: mithunPhoto,
    },
  ]

  const algorithms = [
    {
      name: 'FIFO (First In, First Out)',
      text: 'Removes the page that entered memory earliest. It is simple and fast, but may remove a page that will be used again soon.',
    },
    {
      name: 'Optimal',
      text: 'Replaces the page that will not be used for the longest time in the future. It gives the minimum possible faults, but needs future knowledge.',
    },
    {
      name: 'LRU (Least Recently Used)',
      text: 'Replaces the page that has not been used for the longest time in the past. It is practical and usually performs close to Optimal.',
    },
  ]

  return (
    <div className="site-shell">
      <header className="top-nav">
        <h1 className="brand">Page Replacement Project</h1>
        <nav className="nav-actions">
          <button
            className={`nav-btn ${page === 'home' ? 'nav-btn-active' : ''}`}
            onClick={() => setPage('home')}
          >
            Home
          </button>
          <button
            className={`nav-btn ${page === 'simulator' ? 'nav-btn-active' : ''}`}
            onClick={() => setPage('simulator')}
          >
            Simulator
          </button>
          <button
            className={`nav-btn ${page === 'about' ? 'nav-btn-active' : ''}`}
            onClick={() => setPage('about')}
          >
            About
          </button>
        </nav>
      </header>

      {page === 'home' && (
        <main className="landing-main">
          <section className="hero-section">
            <div className="hero-orb orb-one" aria-hidden="true" />
            <div className="hero-orb orb-two" aria-hidden="true" />
            <div className="hero-orb orb-three" aria-hidden="true" />
            <div className="hero-overlay" aria-hidden="true" />
            <div className="hero-content">
              <p className="hero-kicker">Operating Systems</p>
              <h2>How Page Replacement Works</h2>
              <p className="hero-description">
                Memory management through intelligent page selection. When the OS needs to free up frames,
                the choice of which page to remove determines system performance.
              </p>
              <button className="cta-btn" onClick={() => setPage('simulator')}>
                Explore Simulator
              </button>
            </div>
          </section>

          <section className="algo-grid">
            {algorithms.map((item) => (
              <article key={item.name} className="algo-info-card">
                <h3>{item.name}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </section>
        </main>
      )}

      {page === 'simulator' && <PageRplacement />}

      {page === 'about' && (
        <main className="about-main">
          <section className="hero-section hero-section-about">
            <div className="hero-orb orb-one" aria-hidden="true" />
            <div className="hero-orb orb-two" aria-hidden="true" />
            <div className="hero-orb orb-three" aria-hidden="true" />
            <div className="hero-overlay" aria-hidden="true" />
            <div className="hero-content">
              <p className="hero-kicker">Our Team</p>
              <h2>People Behind This Project</h2>
              <p className="hero-description">
                A collaborative effort to bring clarity to operating system concepts through interactive learning.
              </p>
            </div>
          </section>

          <section className="team-grid">
            {team.map((member) => (
              <article key={member.name} className="person-card">
                <img src={member.photo} alt={member.name} className="person-photo" />
                <div className="person-content">
                  <h3>{member.name}</h3>
                  <p className="person-role">{member.role}</p>
                </div>
              </article>
            ))}
          </section>
        </main>
      )}
    </div>
  )
}

export default App